
import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { ChannelPermissionLevel as ChannelPermissionLevel } from "../databaseTypes/schemas/SimpleCommand";
import { ChoobRole } from "../databaseTypes/schemas/TwitchUsers";
import { ChoobLogger } from "../../utils/ChoobLogger";
import { TwitchManager } from "../../twitch/TwitchClientManager";

export default abstract class BaseCommand {
  logger = ChoobLogger;
  constructor(private name: string, private channelPermissionRequired: ChannelPermissionLevel, private roleRequired: ChoobRole | undefined, private aliases: Array<string>) { }

  getName(): string { return this.name; }
  getCategory(): ChannelPermissionLevel { return this.channelPermissionRequired; }
  getRoleRequired(): ChoobRole | undefined { return this.roleRequired; }
  getAliases(): Array<string> { return this.aliases; }

  abstract run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string> | null): Promise<void>;
}