import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { ChoobLogger } from "../../utils/ChoobLogger";
import { TwitchManager } from "../../twitch/TwitchClientManager";
import { ChannelPermissionLevel } from "../databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../databaseTypes/interfaces/IUser";
import { DiscordManager } from "../../discord/DiscordClientManager";
import { Message, PermissionFlags } from "discord.js";

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
    private guildPermissionRequired: bigint | undefined,
    private choobRoleRequired: ChoobRole | undefined,
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

  abstract run(
    client: DiscordManager,
    message: Message,
    args: Array<string> | null
  ): Promise<void>;
}
