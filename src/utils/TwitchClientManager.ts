import { Collection } from "discord.js";

import { AuthProvider } from "twitch/lib";
import StateManager from "./StateManager";
import BaseCommand from "./structures/BaseCommand";
import { EventHandlerList } from "ircv3/lib/IrcClient"
import BaseSimpleCommand from "./structures/BaseSimpleCommand";
import { SimpleCommand } from "../database/schemas/SimpleCommand";
import { ChatClient } from "twitch-chat-client";


export class TwitchManager extends ChatClient {
  [index: string]: any;

  private _commands = new Collection<string, BaseCommand>();
  private _commandAliases = new Collection<string, string>();
  //private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';

  constructor(authProvider: AuthProvider | undefined, options?: any | undefined) {
    super(authProvider, options);
    StateManager.on('commandUpdated', this.commandUpdated);
  }

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get commandAliases(): Collection<string, string> { return this._commandAliases; }
  get events(): Map<string, EventHandlerList> { return this._events; }
  get prefix(): string { return this._prefix; }
  set prefix(prefix: string) { this._prefix = prefix; }

  commandUpdated(oldCommandName: string, updatedCommand: SimpleCommand | undefined) {

    // Delete all aliases of old command, could probably just check to see if they actually changed at all but eh
    this.commands.get(oldCommandName)?.getAliases().forEach(alias => {
      this._commandAliases.delete(alias);
    });
    this._commandAliases.delete(oldCommandName);

    // Delete old command
    this._commands.delete(oldCommandName);

    // If we didn't delete the command entierly from the database:
    if (updatedCommand) {
      const simpleCommand = new BaseSimpleCommand(updatedCommand.commandName!, updatedCommand.commandResponse!, updatedCommand.commandAliases!, updatedCommand.replyInDM)
      this.addCommand(simpleCommand);
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
}