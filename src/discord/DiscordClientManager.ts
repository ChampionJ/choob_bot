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
import {
  DGSCommandReactionRoleCheckModel,
  DiscordGuildSetting,
} from "../structures/databaseTypes/schemas/DiscordGuildSettings";

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

    DGSCommandReactionRoleCheckModel.watch(undefined, {
      fullDocument: "updateLookup",
    }).on(
      "change",
      async (change) => await this.onDiscordGuildSettingChange(change)
    );

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
    ChoobLogger.info(`Updated simple command, updating rest api now`);
    await this.updateRestCommands();
  }
  async onDiscordGuildSettingChange(change: ChangeEvent<DiscordGuildSetting>) {
    ChoobLogger.debug(`Discord Guild Setting Change!`);
    if (change.operationType === "delete") {
      ChoobLogger.debug(
        `Deleted a discord guild setting: ${change.documentKey._id}`
      );
    } else if (change.operationType === "insert") {
      if (change.fullDocument?.guildId) {
        ChoobLogger.debug(`Found guild, from inserted document`);
        await this.updateRestCommandsForGuild(change.fullDocument.guildId);
      }
    } else if (change.operationType === "update") {
      if (change.fullDocument?.guildId) {
        ChoobLogger.debug(`Found guild, from updated document`);
        await this.updateRestCommandsForGuild(change.fullDocument.guildId);
      }
    }
  }
  async updateRestCommandsForGuild(guildId: string) {
    const appCommands: ApplicationCommandData[] = this.getAllAppCommandsData();
    const guild = await this.guilds.fetch(guildId);
    if (guild) {
      ChoobLogger.debug(`Found guild, attempting to set rest commands`);
      await this.updateGuildRestCommands(guild, appCommands);
    }
  }
  getAllAppCommandsData(): ApplicationCommandData[] {
    const appCommands: ApplicationCommandData[] = [];

    this.hardcodedCommandsByName.each((command) =>
      appCommands.push(command.getApplicationCommand())
    );
    this.globalDatabaseCommandsByName.each((command) =>
      appCommands.push(command.getApplicationCommand())
    );
    ChoobLogger.debug(`Collected all application command data`);
    return appCommands;
  }
  async updateGuildRestCommands(
    guild: Guild,
    appCommands: ApplicationCommandData[]
  ) {
    let fetchedGlobalCommands;

    await guild.commands.set(appCommands).catch((err) => {
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
      let fullPermissions: GuildApplicationCommandPermissionData[] = [];
      fetchedGlobalCommands.each(async (value, key) => {
        let permissions: GuildApplicationCommandPermissionData | undefined;
        ChoobLogger.debug(`Setting permissions for ${value.id} ${value.name}`);
        if (this.hardcodedCommandsByName.has(value.name)) {
          const discCommand = this.hardcodedCommandsByName.get(value.name)!;
          permissions = await discCommand.getSlashCommandPermissionsForGuild(
            value.id,
            guild.id,
            guild.roles.everyone.id
          );
          // ChoobLogger.debug(`hardcoded `, permissions);
        } else if (this.globalDatabaseCommandsByName.has(value.name)) {
          permissions = await this.globalDatabaseCommandsByName
            .get(value.name)!
            .getSlashCommandPermissionsForGuild(value.id, guild.id);
          // ChoobLogger.debug(`database `, permissions);
        }
        if (permissions !== undefined) {
          //ChoobLogger.debug(`not null`, permissions);
          fullPermissions.push(permissions);
        }
        // ChoobLogger.debug(`Set guild permissions: `, fullPermissions);
        await guild.commands.permissions
          .set({ fullPermissions })
          .then(() =>
            ChoobLogger.info(
              `Set guild command permission for command: "${value.name}" in guild: ${guild.id}`
            )
          )
          .catch((err) =>
            ChoobLogger.error(
              `Failed to set guild command permissions for command: "${value.name}" in guild: ${guild.id}`,
              err
            )
          );
      });
    }
  }
  async updateRestCommands() {
    //! These are GLOBAL commands, and should be on every guild

    const appCommands: ApplicationCommandData[] =
      await this.getAllAppCommandsData();
    ChoobLogger.info("Started refreshing application (/) commands.");
    ChoobLogger.info(`Cached guilds: ${this.guilds.cache.size}`);

    await this.guilds.cache.each(async (guild) => {
      ChoobLogger.info(
        `Beginning to update guild commands for id: ${guild.id}`
      );
      await this.updateGuildRestCommands(guild, appCommands);
    });
    ChoobLogger.info("Successfully reloaded application (/) commands.");
  }
}
