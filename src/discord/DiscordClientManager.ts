import { mongoose, DocumentType } from "@typegoose/typegoose";
import {
  Client,
  Collection,
  Guild,
  Intents,
  Message,
  MessageReaction,
  Role,
  User,
} from "discord.js";
import { ChangeEvent } from "mongodb";
import { BaseDiscordCommand } from "../structures/commands/BaseCommand";
import BaseEvent from "../structures/commands/BaseEvent";
import {
  TwitchGlobalChoobCommand,
  DiscordBaseSimpleCommand,
  DiscordGlobalChoobCommand,
} from "../structures/commands/BaseSimpleCommand";
import { IClientManager } from "../structures/databaseTypes/interfaces/IClientManager";
import {
  DiscordCustomCommandModel,
  DiscordGlobalSimpleCommand,
} from "../structures/databaseTypes/schemas/SimpleCommand";
import { ChoobLogger } from "../utils/ChoobLogger";

export class DiscordManager extends Client implements IClientManager {
  private _events = new Collection<string, BaseEvent>();
  private _hardcodedCommands = new Collection<string, BaseDiscordCommand>();
  private _hardcodedCommandAliases = new Collection<string, string>();

  private _simpleCommandObjectIDs = new Collection<
    string,
    DiscordGlobalSimpleCommand
  >();
  private _guildCustomCommands = new Collection<
    string,
    DiscordGlobalChoobCommand
  >();
  private _guildCustomCommandAliases = new Collection<string, string>(); // all aliases : commandID

  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    });

    DiscordCustomCommandModel.watch(undefined, {
      fullDocument: "updateLookup",
    }).on("change", (change) => this.onSimpleCommandChange(change));
  }
  get events(): Collection<string, BaseEvent> {
    return this._events;
  }
  addEvent(event: BaseEvent) {
    this.events.set(event.getName(), event);
    this.on(event.getName(), event.run.bind(event, this));
  }

  get hardcodedCommands(): Collection<string, BaseDiscordCommand> {
    return this._hardcodedCommands;
  }
  get hardcodedCommandAliases(): Collection<string, string> {
    return this._hardcodedCommandAliases;
  }

  get simpleCommandObjectIDs(): Collection<string, DiscordGlobalSimpleCommand> {
    return this._simpleCommandObjectIDs;
  }
  get databaseSimpleCommandsById(): Collection<
    string,
    DiscordGlobalChoobCommand
  > {
    return this._guildCustomCommands;
  }
  get databaseSimpleCommandIdAliases(): Collection<string, string> {
    return this._guildCustomCommandAliases;
  }

  addCommand(command: BaseDiscordCommand) {
    this.hardcodedCommands.set(command.getName(), command);
    this.hardcodedCommandAliases.set(command.getName(), command.getName());
    command.getAliases().forEach((alias: string) => {
      //client.commands.set(alias, simpleCommand);
      this.hardcodedCommandAliases.set(alias, command.getName());
    });
    ChoobLogger.info(`Added discord command: ${command.getName()}`);
  }
  async tryGetCommand(guildId: string, command: string) {
    //* Search for discord specific non-database commands
    const builtinCommandName = this.hardcodedCommandAliases.get(command);
    if (builtinCommandName) {
      return this.hardcodedCommands.get(builtinCommandName);
    }

    //* Next search for any global choob bot simple commands
    const globalCommandID = this.databaseSimpleCommandIdAliases.get(command);
    if (globalCommandID) {
      ChoobLogger.debug(`Found global id: ${globalCommandID}`);
      const res = [...this._guildCustomCommands.keys()];
      return this._guildCustomCommands.get(globalCommandID);
    }

    //* Finally search database for guild specific, custom commands
    let commandFound = await DiscordCustomCommandModel.findOne({
      guildId,
      name: command,
    });
    if (commandFound) {
      if (commandFound.alias) {
        const aliasCommand = await DiscordCustomCommandModel.findById(
          commandFound.alias
        );
        if (aliasCommand) {
          commandFound = aliasCommand;
        } else {
          //! means there was an alias to a non-existing command
        }
      }
      return new DiscordBaseSimpleCommand(commandFound);
    }
    return undefined;
  }

  commandUpdated(
    oldCommand: DiscordGlobalSimpleCommand,
    updatedCommand: DiscordGlobalSimpleCommand | undefined
  ) {
    this.databaseSimpleCommandsById.delete(oldCommand._id.toHexString());
    this.databaseSimpleCommandIdAliases.delete(oldCommand.name);
    this._simpleCommandObjectIDs.delete(oldCommand._id.toHexString());

    // If we didn't delete the command entierly from the database:
    if (updatedCommand) {
      this.addSimpleCommand(updatedCommand);
    }
  }

  addSimpleCommand(command: DiscordGlobalSimpleCommand) {
    this.simpleCommandObjectIDs.set(command._id.toHexString(), command);

    ChoobLogger.debug(`Adding command: ${command.name}`);
    // this is the actual command, not an alias to a diff one
    const simpleCommand = new DiscordGlobalChoobCommand(command);
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

  onSimpleCommandChange(change: ChangeEvent<DiscordGlobalSimpleCommand>) {
    if (
      change.operationType === "update" ||
      change.operationType === "delete" ||
      change.operationType === "insert"
    ) {
      let oldCommand: DiscordGlobalSimpleCommand | undefined = undefined;
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
            change.fullDocument as DocumentType<DiscordGlobalSimpleCommand>
          );
        }
      } else if (change.operationType === "update") {
        ChoobLogger.debug(`Updated a simple command!`);
        if (oldCommand) {
          ChoobLogger.debug("Found the added simple command in local array!");
          this.commandUpdated(
            oldCommand,
            change.fullDocument as DocumentType<DiscordGlobalSimpleCommand>
          );
        }
      }
    }
  }
}
