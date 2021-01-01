import { Collection } from "discord.js";
import { AuthProvider } from "twitch/lib";
import StateManager from "./StateManager";
import BaseCommand from "./structures/BaseCommand";
import { EventHandlerList } from "ircv3/lib/IrcClient"
import BaseSimpleCommand from "./structures/BaseSimpleCommand";
import { TwitchCustomCommand, TwitchCustomCommandInfo, TwitchCustomCommandModel } from "../database/schemas/SimpleCommand";
import { ChatClient } from "twitch-chat-client";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { ChangeEvent } from "mongodb";
import winston from "winston";

// interface SimpleCommandInfo {
//   commandName: string,
//   channelName: string
// }

export class TwitchManager extends ChatClient {
  [index: string]: any;

  private _commands = new Collection<string, BaseCommand>();
  private _commandAliases = new Collection<string, string>();

  private _simpleCommandObjectIDs = new Collection<string, TwitchCustomCommand>();
  private _channelCustomCommands = new Collection<string, BaseSimpleCommand>();
  private _channelCustomCommandAliases = new Collection<string, Collection<string, string>>(); //channel name returns all aliases : commandName



  //private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';
  logger = winston.loggers.get('main');

  constructor(authProvider: AuthProvider | undefined, options?: any | undefined) {
    super(authProvider, options);
    StateManager.on('commandUpdated', this.commandUpdated);
    TwitchCustomCommandModel.watch(undefined, { fullDocument: 'updateLookup' }).on('change', (change) => this.onSimpleCommandChange(change))
  }

  tryGetCommand(channel: string, command: string): BaseCommand | undefined {
    const builtinCommandName = this.commandAliases.get(command);
    if (builtinCommandName) {
      return this.commands.get(builtinCommandName);
    }
    const test = this.channelCustomCommandAliases.get("*")?.keyArray();
    this.logger.debug(test!)
    const globalCommandID = this.channelCustomCommandAliases.get("*")?.get(command);
    if (globalCommandID) {
      this.logger.debug(`Found global id: ${globalCommandID}`)
      const res = this._channelCustomCommands.keyArray();
      res.forEach(element => {
        this.logger.debug(element)
      });
      return this._channelCustomCommands.get(globalCommandID);

    }
    const channelCommandID = this.channelCustomCommandAliases.get(channel)?.get(command);
    if (channelCommandID) {
      return this._channelCustomCommands.get(channelCommandID);
    }
    return undefined;
  }

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get commandAliases(): Collection<string, string> { return this._commandAliases; }

  get simpleCommandObjectIDs(): Collection<string, TwitchCustomCommand> { return this._simpleCommandObjectIDs; }
  get channelCustomCommands(): Collection<string, BaseSimpleCommand> { return this._channelCustomCommands; }
  get channelCustomCommandAliases(): Collection<string, Collection<string, string>> { return this._channelCustomCommandAliases; }

  get events(): Map<string, EventHandlerList> { return this._events; }
  get prefix(): string { return this._prefix; }
  set prefix(prefix: string) { this._prefix = prefix; }
  /** */
  commandUpdated(oldCommand: TwitchCustomCommand, updatedCommand: TwitchCustomCommand | undefined) {

    this.channelCustomCommands.delete(oldCommand._id.toHexString());
    this.channelCustomCommandAliases.get(oldCommand.info.channel)?.delete(oldCommand.info.name)
    this._simpleCommandObjectIDs.delete(oldCommand._id.toHexString())

    // If we didn't delete the command entierly from the database:
    if (updatedCommand) {
      this.addSimpleCommand(updatedCommand)
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
  addSimpleCommand(command: TwitchCustomCommand) {
    this.simpleCommandObjectIDs.set(command._id.toHexString(), command)

    if (!this.channelCustomCommandAliases.has(command.info.channel!)) {
      this.logger.debug(`Creating new custom command alias collection for ${command.info.channel}`)
      this.channelCustomCommandAliases.set(command.info.channel!, new Collection<string, string>())
    }

    if (command.alias) {
      if (this.channelCustomCommands.has(command.alias.toHexString())) {
        this.logger.debug(`Adding command alias: ${command.info.name}`)
        // TODO: Should make sure to add commands without aliases first on startup 
        this.channelCustomCommandAliases.get(command.info.channel!)?.set(command.info.name, command.alias.toHexString())
      }
    }
    else if (command.response) {
      this.logger.debug(`Adding command: ${command.info.name}`)
      // this is the actual command, not an alias to a diff one
      const simpleCommand = new BaseSimpleCommand(command)
      this.channelCustomCommands.set(command._id.toHexString(), simpleCommand);
      //be sure to set an alias for lookup later
      this.channelCustomCommandAliases.get(command.info.channel!)?.set(command.info.name, command._id.toHexString())
    }
  }

  onSimpleCommandChange(change: ChangeEvent<TwitchCustomCommand>) {

    if (change.operationType === "update" || change.operationType === "delete" || change.operationType === "insert") {
      let oldCommand: TwitchCustomCommand | undefined = undefined;
      let oldId = new mongoose.Types.ObjectId(change.documentKey._id.toHexString())
      this.logger.debug(`old id: ${oldId}`);
      oldCommand = this.simpleCommandObjectIDs.get(change.documentKey._id.toHexString())
      if (change.operationType === "delete") {
        this.logger.debug(`Deleted a simple command: ${change.documentKey._id.toHexString()}`)
        if (oldCommand) {
          this.logger.debug("Found the simple command in local array!")
          this.commandUpdated(oldCommand, undefined)
        }
      }
      else if (change.operationType === "insert") {
        this.logger.debug(`Added a simple command! ${change.documentKey._id.toHexString()}`)
        if (!oldCommand) {
          this.logger.debug("Didn't find the simple command in local array!")
          this.addSimpleCommand(change.fullDocument as DocumentType<TwitchCustomCommand>)
        }
      }
      else if (change.operationType === "update") {
        this.logger.debug(`Updated a simple command!`)
        if (oldCommand) {
          this.logger.debug("Found the added simple command in local array!")
          this.commandUpdated(oldCommand, change.fullDocument as DocumentType<TwitchCustomCommand>)
          // TODO should probably check all the individual changes and push that directly. 
        }
      }
    }
  }
}