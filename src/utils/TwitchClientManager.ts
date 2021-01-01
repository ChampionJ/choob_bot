import { Collection } from "discord.js";
import { AuthProvider } from "twitch/lib";
import StateManager from "./StateManager";
import BaseCommand from "./structures/BaseCommand";
import { EventHandlerList } from "ircv3/lib/IrcClient"
import BaseSimpleCommand from "./structures/BaseSimpleCommand";
import { CustomCommand, CustomCommandModel } from "../database/schemas/SimpleCommand";
import { ChatClient } from "twitch-chat-client";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { ChangeEvent } from "mongodb";
import winston from "winston";

interface SimpleCommandInfo {
  commandName: string,
  channelName: string
}

export class TwitchManager extends ChatClient {
  [index: string]: any;

  private _commands = new Collection<string, BaseCommand>();
  private _commandAliases = new Collection<string, string>();

  private _simpleCommandObjectIDs = new Collection<mongoose.Types.ObjectId, SimpleCommandInfo>();
  private _channelCustomCommands = new Collection<string, Collection<string, BaseSimpleCommand>>();
  private _channelCustomCommandAliases = new Collection<string, Collection<string, string>>(); //channel name returns all aliases : commandName



  //private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';
  logger = winston.loggers.get('main');

  constructor(authProvider: AuthProvider | undefined, options?: any | undefined) {
    super(authProvider, options);
    StateManager.on('commandUpdated', this.commandUpdated);
    CustomCommandModel.watch(undefined, { fullDocument: 'updateLookup' }).on('change', (change) => this.onSimpleCommandChange(change))
  }

  tryGetCommand(channel: string, command: string): BaseCommand | undefined {
    const builtinCommandName = this.commandAliases.get(command);
    if (builtinCommandName) {
      return this.commands.get(builtinCommandName);
    }
    const test = this.channelCustomCommandAliases.get("*")?.keyArray();
    this.logger.debug(test!)
    const globalCommandName = this.channelCustomCommandAliases.get("*")?.get(command);
    if (globalCommandName) {
      return this._channelCustomCommands.get("*")?.get(globalCommandName);

    }
    const channelCommandName = this.channelCustomCommandAliases.get(channel)?.get(command);
    if (channelCommandName) {
      return this._channelCustomCommands.get(channel)?.get(channelCommandName);
    }
    return undefined;
  }

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get commandAliases(): Collection<string, string> { return this._commandAliases; }

  get simpleCommandObjectIDs(): Collection<mongoose.Types.ObjectId, SimpleCommandInfo> { return this._simpleCommandObjectIDs; }
  get channelCustomCommands(): Collection<string, Collection<string, BaseSimpleCommand>> { return this._channelCustomCommands; }
  get channelCustomCommandAliases(): Collection<string, Collection<string, string>> { return this._channelCustomCommandAliases; }

  get events(): Map<string, EventHandlerList> { return this._events; }
  get prefix(): string { return this._prefix; }
  set prefix(prefix: string) { this._prefix = prefix; }
  /** */
  commandUpdated(oldCommandInfo: SimpleCommandInfo, updatedCommand: CustomCommand | undefined) {

    // Delete all aliases of old command, could probably just check to see if they actually changed at all but eh
    this.channelCustomCommands.get(oldCommandInfo.channelName)?.get(oldCommandInfo.commandName)?.getAliases().forEach(alias => {
      this.channelCustomCommandAliases.get(oldCommandInfo.channelName)?.delete(alias);
    });
    this.channelCustomCommandAliases.get(oldCommandInfo.channelName)?.delete(oldCommandInfo.commandName);;

    const objID = this._simpleCommandObjectIDs.findKey((value) => value === oldCommandInfo)
    this._simpleCommandObjectIDs.delete(objID!)

    // Delete old command
    this.channelCustomCommands.get(oldCommandInfo.channelName)?.delete(oldCommandInfo.commandName);

    // If we didn't delete the command entierly from the database:
    if (updatedCommand) {
      this.addSimpleCommand(updatedCommand)
      // const simpleCommand = new BaseSimpleCommand(updatedCommand.commandName!, updatedCommand.commandResponse!, updatedCommand.commandAliases!, updatedCommand.replyInDM)
      // this.addCommand(simpleCommand);
    }
  }
  addCommand(command: BaseCommand) {
    this.commands.set(command.getName(), command);
    this.commandAliases.set(command.getName(), command.getName())
    command.getAliases().forEach((alias: string) => {
      //client.commands.set(alias, simpleCommand);
      this.commandAliases.set(alias, command.getName())
    });
  }
  addSimpleCommand(command: CustomCommand) {

    const simpleCommand = new BaseSimpleCommand(command)
    this._simpleCommandObjectIDs.set(command._id!, { commandName: command.info.name!, channelName: command.info.channel! })

    if (!this.channelCustomCommands.has(command.info.channel!)) {
      this.logger.debug(`Creating new custom command collection for ${command.info.channel}`)
      this.channelCustomCommands.set(command.info.channel!, new Collection<string, BaseSimpleCommand>())
    }
    if (!this.channelCustomCommandAliases.has(command.info.channel!)) {
      this.logger.debug(`Creating new custom command alias collection for ${command.info.channel}`)
      this.channelCustomCommandAliases.set(command.info.channel!, new Collection<string, string>())
    }

    const channelCommands = this.channelCustomCommands.get(command.info.channel!);
    const channelCommandAliases = this.channelCustomCommandAliases.get(command.info.channel!);

    channelCommands?.set(simpleCommand.getName(), simpleCommand);

    channelCommandAliases?.set(simpleCommand.getName(), simpleCommand.getName())
    simpleCommand.getAliases().forEach((alias: string) => {
      channelCommandAliases?.set(alias, simpleCommand.getName())
    });
  }

  onSimpleCommandChange(change: ChangeEvent<any>) {

    if (change.operationType === "update" || change.operationType === "delete" || change.operationType === "insert") {
      let commandInfo: SimpleCommandInfo | undefined = undefined;
      for (let [id, oldName] of this._simpleCommandObjectIDs.entries()) {
        if (id?.equals(change.documentKey._id as string)) {
          commandInfo = oldName;
          break;
        }
      }
      if (change.operationType === "delete") {
        this.logger.debug(`Deleted a simple command: ${change.documentKey._id}`)
        if (commandInfo) {
          this.logger.debug("Found the simple command in local array!")
          this.commandUpdated(commandInfo, undefined)
        }
      }
      else if (change.operationType === "insert") {
        this.logger.debug(`Added a simple command! ${change.documentKey._id}`)
        if (!commandInfo) {
          this.logger.debug("Didn't find the simple command in local array!")
          this.addSimpleCommand(change.fullDocument as DocumentType<CustomCommand>)
        }
      }
      else if (change.operationType === "update") {
        this.logger.debug(`Updated a simple command!`)
        if (commandInfo) {
          this.logger.debug("Found the added simple command in local array!")
          this.commandUpdated(commandInfo, change.fullDocument as DocumentType<CustomCommand>)
          // TODO should probably check all the individual changes, if they're only adding an alias or something we can just push that directly. 
        }
      }
    }
  }
}