import { mongoose, DocumentType } from "@typegoose/typegoose";

import { Routes } from "discord-api-types/v9";
import {
  ApplicationCommandData,
  ApplicationCommandPermissionData,
  Client,
  Collection,
  Guild,
  GuildApplicationCommandPermissionData,
  Intents,
  Message,
  MessageReaction,
  Role,
  User,
} from "discord.js";
import { REST } from "@discordjs/rest";
import { ChangeEvent } from "mongodb";
import { BaseDiscordCommand } from "../structures/commands/BaseCommand";
import BaseEvent from "../structures/commands/BaseEvent";
import {
  DiscordBaseSimpleCommand,
  DiscordGlobalChoobCommand,
} from "../structures/commands/BaseSimpleCommand";
import { IClientManager } from "../structures/databaseTypes/interfaces/IClientManager";
import {
  DiscordCustomCommand,
  DiscordCustomCommandModel,
  DiscordGlobalSimpleCommand,
} from "../structures/databaseTypes/schemas/SimpleCommand";
import { ChoobLogger } from "../utils/ChoobLogger";

export class DiscordManager extends Client implements IClientManager {
  private _events = new Collection<string, BaseEvent>();
  private _hardcodedCommandsByName = new Collection<
    string,
    BaseDiscordCommand
  >();
  private _globalDatabaseCommandsByName = new Collection<
    string,
    DiscordGlobalChoobCommand
  >();
  //private rest: REST;
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

    //this.rest = new REST({ version: "9" }).setToken(token);
  }
  get events(): Collection<string, BaseEvent> {
    return this._events;
  }
  addEvent(event: BaseEvent) {
    this.events.set(event.getName(), event);
    this.on(event.getName(), event.run.bind(event, this));
  }

  get hardcodedCommandsByName(): Collection<string, BaseDiscordCommand> {
    return this._hardcodedCommandsByName;
  }

  get globalDatabaseCommandsByName(): Collection<
    string,
    DiscordGlobalChoobCommand
  > {
    return this._globalDatabaseCommandsByName;
  }

  addCommand(command: BaseDiscordCommand) {
    this.hardcodedCommandsByName.set(command.getName(), command);

    ChoobLogger.info(`Added discord command: ${command.getName()}`);
  }
  async tryGetCommand(guildId: string, command: string) {
    //* Search for discord specific non-database commands

    if (this.hardcodedCommandsByName.has(command)) {
      return this.hardcodedCommandsByName.get(command);
    }

    //* Next search for any global choob bot simple commands
    if (this._globalDatabaseCommandsByName.has(command)) {
      return this._globalDatabaseCommandsByName.get(command);
    }

    //* Finally search database for guild specific, custom commands
    let commandFound = await DiscordCustomCommandModel.findOne({
      guildId,
      name: command,
    });
    if (commandFound) {
      return new DiscordBaseSimpleCommand(commandFound);
    }
    return undefined;
  }

  commandUpdated(
    oldCommand: DiscordGlobalSimpleCommand,
    updatedCommand: DiscordGlobalSimpleCommand | undefined
  ) {
    this.globalDatabaseCommandsByName.delete(oldCommand.name);

    // If we didn't delete the command entierly from the database:
    if (updatedCommand) {
      this.addSimpleCommand(updatedCommand);
    }
  }

  addSimpleCommand(command: DiscordGlobalSimpleCommand) {
    ChoobLogger.debug(`Adding command: ${command.name}`);
    // this is the actual command, not an alias to a diff one
    const simpleCommand = new DiscordGlobalChoobCommand(command);
    this.globalDatabaseCommandsByName.set(command.name, simpleCommand);
  }

  async onSimpleCommandChange(change: ChangeEvent<DiscordGlobalSimpleCommand>) {
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
      oldCommand = this._globalDatabaseCommandsByName.find((value) => {
        return value.data._id === change.documentKey._id;
      })?.data;

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
    await this.updateRestCommands();
  }
  async updateRestCommands() {
    //! These are GLOBAL commands, and should be on every guild
    const commands: object[] = [];
    const appCommands: ApplicationCommandData[] = [];
    const rest = new REST({ version: "9" }).setToken(this.token!);

    this.hardcodedCommandsByName.each((command) =>
      commands.push(command.getSlashCommand().toJSON())
    );
    this.globalDatabaseCommandsByName.each((command) =>
      commands.push(command.getSlashCommand().toJSON())
    );

    this.hardcodedCommandsByName.each((command) =>
      appCommands.push(command.getApplicationCommand())
    );
    this.globalDatabaseCommandsByName.each((command) =>
      appCommands.push(command.getApplicationCommand())
    );

    ChoobLogger.info("Started refreshing application (/) commands.");

    // await rest.put(
    //   Routes.applicationGuildCommands(
    //     process.env.DISCORD_CLIENT_ID!,
    //     process.env.DISCORD_DEV_SERVER_ID!
    //   ),
    //   {
    //     body: commands,
    //   }
    // );

    await this.guilds.cache.each(async (guild) => {
      let fetchedGlobalCommands;

      guild.commands.set(appCommands).catch((err) => {
        ChoobLogger.error(`Error setting commands in ${guild.name}: ${err}`);
      });
      fetchedGlobalCommands = await guild?.commands.fetch().catch((err) => {
        ChoobLogger.error(
          `Error fetching discord commands in ${guild.name}: ${err}`
        );
      });

      if (fetchedGlobalCommands) {
        ChoobLogger.debug(
          `Fetched ${fetchedGlobalCommands.size} application commands`
        );
        // await this.guilds.cache.each(async (guild) => {
        //Each Guild:
        let fullPermissions: GuildApplicationCommandPermissionData[] = [];

        fetchedGlobalCommands.each(async (value, key) => {
          let permissions: GuildApplicationCommandPermissionData | undefined;
          ChoobLogger.debug(
            `Setting permissions for ${value.id} ${value.name}`
          );

          if (this.hardcodedCommandsByName.has(value.name)) {
            const discCommand = this.hardcodedCommandsByName.get(value.name)!;

            permissions = await discCommand.getSlashCommandPermissionsForGuild(
              value.id,
              guild.id,
              guild.roles.everyone.id
            );
            ChoobLogger.debug(`hardcoded `, permissions);
          } else if (this.globalDatabaseCommandsByName.has(value.name)) {
            permissions = await this.globalDatabaseCommandsByName
              .get(value.name)!
              .getSlashCommandPermissionsForGuild(value.id, guild.id);
            ChoobLogger.debug(`database `, permissions);
          }
          if (permissions !== undefined) {
            ChoobLogger.debug(`not null`, permissions);
            fullPermissions.push(permissions);
          }
          // fullPermissions.push({
          //   id: guild.id,
          //   permissions: [...permissions],
          // });

          // await value.permissions.set({ fullPermissions });
          ChoobLogger.debug(`Set guild permissions: `, fullPermissions);
          await guild.commands.permissions.set({ fullPermissions });
        });
      }
    });
    ChoobLogger.info("Successfully reloaded application (/) commands.");
  }
}
