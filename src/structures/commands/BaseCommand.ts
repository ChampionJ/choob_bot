import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { ChoobLogger } from "../../utils/ChoobLogger";
import { TwitchManager } from "../../twitch/TwitchClientManager";
import { ChannelPermissionLevel } from "../databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../databaseTypes/interfaces/IUser";
import { DiscordManager } from "../../discord/DiscordClientManager";
import {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandPermissionData,
  CommandInteraction,
  GuildApplicationCommandPermissionData,
  Interaction,
  Message,
  PermissionFlags,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export interface IBaseCommand {
  getName(): string;
}

export abstract class BaseTwitchCommand implements IBaseCommand {
  constructor(
    private name: string,
    private channelPermissionRequired: ChannelPermissionLevel,
    private roleRequired: ChoobRole | undefined,
    private aliases: Array<string>
  ) {}

  getName(): string {
    return this.name;
  }
  getCategory(): ChannelPermissionLevel {
    return this.channelPermissionRequired;
  }
  getRoleRequired(): ChoobRole | undefined {
    return this.roleRequired;
  }
  getAliases(): Array<string> {
    return this.aliases;
  }

  abstract run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string> | null
  ): Promise<void>;
}

export abstract class BaseDiscordCommand implements IBaseCommand {
  constructor(
    private name: string,
    private choobRoleRequired: ChoobRole | undefined,
    private guildPermissionRequired: bigint | undefined,
    private roleRequired: Array<string> | undefined,
    private aliases: Array<string>
  ) {}

  getName(): string {
    return this.name;
  }
  getGuildPermissionRequired(): bigint | undefined {
    return this.guildPermissionRequired;
  }
  getChoobRoleRequired(): ChoobRole | undefined {
    return this.choobRoleRequired;
  }
  getRoleRequired(): Array<string> | undefined {
    return this.roleRequired;
  }
  getAliases(): Array<string> {
    return this.aliases;
  }
  abstract getSlashCommand(): SlashCommandBuilder;
  abstract getApplicationCommand(): ApplicationCommandData;
  abstract getSlashCommandPermissionsForGuild(
    commandId: string,
    guildId: string,
    everyoneRoleId: string
  ): Promise<GuildApplicationCommandPermissionData | undefined>;
  async getSlashCommandPermissionsForRoles(
    roles: string[],
    givePermission = true
  ): Promise<ApplicationCommandPermissionData[]> {
    let perms: ApplicationCommandPermissionData[] = [];
    roles.forEach((role) => {
      perms.push({
        id: role,
        type: "ROLE",
        permission: givePermission,
      });
    });
    return perms;
  }

  abstract run(
    client: DiscordManager,
    message: Message,
    args: Array<string> | null
  ): Promise<void>;

  abstract runInteraction(
    client: DiscordManager,
    interaction: CommandInteraction
  ): Promise<void>;
}
