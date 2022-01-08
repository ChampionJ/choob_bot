import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { TwitchManager } from "../../TwitchClientManager";
import { BaseTwitchCommand } from "../../../structures/commands/BaseCommand";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobLogger } from "../../../utils/ChoobLogger";

export default class AdminTestCommand extends BaseTwitchCommand {
  constructor() {
    super("modtest", ChannelPermissionLevel.MODERATOR, undefined, []);
  }
  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ) {
    client.sendMsg(message.channelId!, targetChannel, "Mod-test command works");
  }
}
