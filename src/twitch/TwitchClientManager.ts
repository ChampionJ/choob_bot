import { Collection } from "discord.js";
import { AuthProvider } from "twitch/lib";
import { ApiClient } from "twitch";
import StateManager from "../utils/StateManager";
import { BaseTwitchCommand } from "../structures/commands/BaseCommand";
import { EventHandlerList } from "ircv3/lib/IrcClient";
import {
  TwitchBaseSimpleCommand,
  TwitchGlobalChoobCommand,
} from "../structures/commands/BaseSimpleCommand";
import {
  TwitchCustomCommand,
  TwitchCustomCommandModel,
  TwitchGlobalSimpleCommand,
  TwitchGlobalSimpleCommandModel,
} from "../structures/databaseTypes/schemas/SimpleCommand";
import { ChatClient, ChatSayMessageAttributes } from "twitch-chat-client";
import { mongoose, DocumentType } from "@typegoose/typegoose";
import { ChangeEvent } from "mongodb";
import { ChoobLogger } from "../utils/ChoobLogger";
import { IClientManager } from "../structures/databaseTypes/interfaces/IClientManager";
import BaseEvent from "../structures/commands/BaseEvent";

export class TwitchManager extends ChatClient implements IClientManager {
  [index: string]: any;

  private _hardcodedCommands = new Collection<string, BaseTwitchCommand>();
  private _hardcodedCommandAliases = new Collection<string, string>();

  private _simpleCommandObjectIDs = new Collection<
    string,
    TwitchGlobalSimpleCommand
  >();
  private _channelCustomCommands = new Collection<
    string,
    TwitchGlobalChoobCommand
  >();
  private _channelCustomCommandAliases = new Collection<string, string>(); // all aliases : commandID

  private _prefix = "!";
  api: ApiClient;

  constructor(
    authProvider: AuthProvider | undefined,
    options?: any | undefined
  ) {
    super(authProvider, options);
    this.api = new ApiClient({ authProvider: authProvider });
    StateManager.on("commandUpdated", this.commandUpdated);
    StateManager.on("botInChatUpdate", (name, join) => {
      this.onBotInChatUpdate(name, join);
    });
    // event.run.bind(event, client)
    TwitchCustomCommandModel.watch(undefined, {
      fullDocument: "updateLookup",
    }).on("change", (change) => this.onSimpleCommandChange(change));
  }
  sendMsg(
    channelId: string,
    channel: string,
    message: string,
    attributes?: ChatSayMessageAttributes
  ) {
    // TODO check channel settings to see if should be colored
    if (StateManager.twitchChannelConfigs.get(channel)?.colorAllMessages) {
      ChoobLogger.debug(`Color all messages!`);
      this.action(channel, message);
    } else {
      this.say(channel, message, attributes);
    }
  }

  async tryGetCommand(channelId: string, command: string) {
    //* Search for twitch specific non-database commands
    const builtinCommandName = this.hardcodedCommandAliases.get(command);
    if (builtinCommandName) {
      return this.hardcodedCommands.get(builtinCommandName);
    }

    //* Next search for any global choob bot simple commands
    const globalCommandID = this.databaseSimpleCommandIdAliases.get(command);
    if (globalCommandID) {
      ChoobLogger.debug(`Found global id: ${globalCommandID}`);
      const res = [...this._channelCustomCommands.keys()];
      return this._channelCustomCommands.get(globalCommandID);
    }
    //* Finally search database for channel specific, custom commands
    let commandFound = await TwitchCustomCommandModel.findOne({
      channelId,
      name: command,
    });
    if (commandFound) {
      if (commandFound.alias) {
        const aliasCommand = await TwitchCustomCommandModel.findById(
          commandFound.alias
        );
        if (aliasCommand) {
          commandFound = aliasCommand;
        } else {
          //! means there was an alias to a non-existing command
        }
      }
      return new TwitchBaseSimpleCommand(commandFound);
    }
    return undefined;
  }

  get hardcodedCommands(): Collection<string, BaseTwitchCommand> {
    return this._hardcodedCommands;
  }
  get hardcodedCommandAliases(): Collection<string, string> {
    return this._hardcodedCommandAliases;
  }

  get simpleCommandObjectIDs(): Collection<string, TwitchGlobalSimpleCommand> {
    return this._simpleCommandObjectIDs;
  }
  get databaseSimpleCommandsById(): Collection<
    string,
    TwitchGlobalChoobCommand
  > {
    return this._channelCustomCommands;
  }
  get databaseSimpleCommandIdAliases(): Collection<string, string> {
    return this._channelCustomCommandAliases;
  }

  get events(): Map<string, EventHandlerList> {
    return this._events;
  }
  get prefix(): string {
    return this._prefix;
  }
  set prefix(prefix: string) {
    this._prefix = prefix;
  }
  addEvent(event: BaseEvent) {
    ChoobLogger.info(`Added event ${event.getName()}`);
    this[event.getName()](event.run.bind(event, this));
  }
  /** */
  commandUpdated(
    oldCommand: TwitchGlobalSimpleCommand,
    updatedCommand: TwitchGlobalSimpleCommand | undefined
  ) {
    this.databaseSimpleCommandsById.delete(oldCommand._id.toHexString());
    this.databaseSimpleCommandIdAliases.delete(oldCommand.name);
    this._simpleCommandObjectIDs.delete(oldCommand._id.toHexString());

    // If we didn't delete the command entierly from the database:
    if (updatedCommand) {
      this.addSimpleCommand(updatedCommand);
    }
  }
  addCommand(command: BaseTwitchCommand) {
    this.hardcodedCommands.set(command.getName(), command);
    this.hardcodedCommandAliases.set(command.getName(), command.getName());
    command.getAliases().forEach((alias: string) => {
      //client.commands.set(alias, simpleCommand);
      this.hardcodedCommandAliases.set(alias, command.getName());
    });
  }
  addSimpleCommand(command: TwitchGlobalSimpleCommand) {
    this.simpleCommandObjectIDs.set(command._id.toHexString(), command);

    ChoobLogger.debug(`Adding command: ${command.name}`);
    // this is the actual command, not an alias to a diff one
    const simpleCommand = new TwitchGlobalChoobCommand(command);
    this.databaseSimpleCommandsById.set(
      command._id.toHexString(),
      simpleCommand
    );
    //be sure to set an alias for lookup later
    this.databaseSimpleCommandIdAliases.set(
      command.name,
      command._id.toHexString()
    );

    if (command.aliases) {
      command.aliases.forEach((alias) => {
        ChoobLogger.debug(`Adding command alias: ${alias}`);
        this.databaseSimpleCommandIdAliases.set(
          alias,
          command._id.toHexString()
        );
      });
    }
  }

  async onBotInChatUpdate(channelName: string, botIsInChannel: boolean) {
    if (botIsInChannel) {
      await this.join(channelName);
    } else {
      ChoobLogger.info(`Parting from ${channelName}`);
      await this.part(channelName);
    }
  }

  onSimpleCommandChange(change: ChangeEvent<TwitchGlobalSimpleCommand>) {
    if (
      change.operationType === "update" ||
      change.operationType === "delete" ||
      change.operationType === "insert"
    ) {
      let oldCommand: TwitchGlobalSimpleCommand | undefined = undefined;
      const oldId = new mongoose.Types.ObjectId(
        change.documentKey._id.toHexString()
      );
      ChoobLogger.debug(`old id: ${oldId}`);
      oldCommand = this.simpleCommandObjectIDs.get(
        change.documentKey._id.toHexString()
      );
      if (change.operationType === "delete") {
        ChoobLogger.debug(
          `Deleted a simple command: ${change.documentKey._id.toHexString()}`
        );
        if (oldCommand) {
          ChoobLogger.debug("Found the simple command in local array!");
          this.commandUpdated(oldCommand, undefined);
        }
      } else if (change.operationType === "insert") {
        ChoobLogger.debug(
          `Added a simple command! ${change.documentKey._id.toHexString()}`
        );
        if (!oldCommand) {
          ChoobLogger.debug("Didn't find the simple command in local array!");
          this.addSimpleCommand(
            change.fullDocument as DocumentType<TwitchGlobalSimpleCommand>
          );
        }
      } else if (change.operationType === "update") {
        ChoobLogger.debug(`Updated a simple command!`);
        if (oldCommand) {
          ChoobLogger.debug("Found the added simple command in local array!");
          this.commandUpdated(
            oldCommand,
            change.fullDocument as DocumentType<TwitchGlobalSimpleCommand>
          );
        }
      }
    }
  }
}
