
import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import winston from "winston";
import { TwitchManager, TwitchMessage } from "../../types";


export default abstract class BaseCommand {
  logger = winston.loggers.get('main');
  constructor(private name: string, private category: string, private permissionLevel: number, private aliases: Array<string>) { }

  getName(): string { return this.name; }
  getCategory(): string { return this.category; }
  getPermissionLevel(): number { return this.permissionLevel; }
  getAliases(): Array<string> { return this.aliases; }

  abstract run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string> | null): Promise<void>;
}