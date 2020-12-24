import { Collection } from "discord.js";
import { AuthProvider } from "twitch/lib";
import StateManager from "./StateManager";
import BaseCommand from "./structures/BaseCommand";
import { EventHandlerList } from "ircv3/lib/IrcClient"
import BaseSimpleCommand from "./structures/BaseSimpleCommand";
import { SimpleCommand, SimpleCommandModel } from "../database/schemas/SimpleCommand";
import { ChatClient } from "twitch-chat-client";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { ChangeEvent } from "mongodb";
import winston from "winston";

export class TwitchManager extends ChatClient {
  [index: string]: any;

  private _commands = new Collection<string, BaseCommand>();
  private _commandAliases = new Collection<string, string>();
  private _simpleCommandObjectIDs = new Collection<mongoose.Types.ObjectId, string>();
  //private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';
  logger = winston.loggers.get('main');

  constructor(authProvider: AuthProvider | undefined, options?: any | undefined) {
    super(authProvider, options);
    StateManager.on('commandUpdated', this.commandUpdated);
    SimpleCommandModel.watch(undefined, { fullDocument: 'updateLookup' }).on('change', (change) => this.onSimpleCommandChange(change))
  }

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get commandAliases(): Collection<string, string> { return this._commandAliases; }
  get simpleCommandObjectIDs(): Collection<mongoose.Types.ObjectId, string> { return this._simpleCommandObjectIDs; }
  get events(): Map<string, EventHandlerList> { return this._events; }
  get prefix(): string { return this._prefix; }
  set prefix(prefix: string) { this._prefix = prefix; }
  /** */
  commandUpdated(oldCommandName: string, updatedCommand: SimpleCommand | undefined) {

    // Delete all aliases of old command, could probably just check to see if they actually changed at all but eh
    this.commands.get(oldCommandName)?.getAliases().forEach(alias => {
      this._commandAliases.delete(alias);
    });
    this._commandAliases.delete(oldCommandName);
    const objID = this._simpleCommandObjectIDs.findKey((value) => value === oldCommandName)
    this._simpleCommandObjectIDs.delete(objID!)

    // Delete old command
    this._commands.delete(oldCommandName);

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
  addSimpleCommand(command: SimpleCommand) {

    const simpleCommand = new BaseSimpleCommand(command.commandName!, command.commandResponse!, command.commandAliases!, command.replyInDM)
    this._simpleCommandObjectIDs.set(command._id!, command.commandName!)
    this.addCommand(simpleCommand);
  }

  onSimpleCommandChange(change: ChangeEvent<any>) {

    if (change.operationType === "update" || change.operationType === "delete" || change.operationType === "insert") {
      let commandName = '';
      for (let [id, oldName] of this._simpleCommandObjectIDs.entries()) {
        if (id?.equals(change.documentKey._id as string)) {
          commandName = oldName;
          break;
        }
      }
      if (change.operationType === "delete") {
        this.logger.debug(`Deleted a simple command: ${change.documentKey._id}`)
        if (commandName !== '') {
          this.logger.debug("Found the simple command in local array!")
          this.commandUpdated(commandName, undefined)
        }
      }
      else if (change.operationType === "insert") {
        this.logger.debug(`Added a simple command! ${change.documentKey._id}`)
        if (commandName === '') {
          this.logger.debug("Didn't find the simple command in local array!")
          this.addSimpleCommand(change.fullDocument as DocumentType<SimpleCommand>)
        }
      }
      else if (change.operationType === "update") {
        this.logger.debug(`Updated a simple command!`)
        if (commandName !== '') {
          this.logger.debug("Found the added simple command in local array!")
          this.commandUpdated(commandName, change.fullDocument as DocumentType<SimpleCommand>)
          // TODO should probably check all the individual changes, if they're only adding an alias or something we can just push that directly. 
        }
      }
    }
  }
}