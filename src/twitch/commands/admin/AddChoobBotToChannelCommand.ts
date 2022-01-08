import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { TwitchManager } from "../../TwitchClientManager";
import { BaseTwitchCommand } from "../../../structures/commands/BaseCommand";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";
import { ChoobLogger } from "../../../utils/ChoobLogger";

export default class AddChoobBotToChannelCommand extends BaseTwitchCommand {
  constructor() {
    super(
      "addchoobbottochannel",
      ChannelPermissionLevel.GENERAL,
      ChoobRole.ADMIN,
      []
    );
  }

  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ): Promise<void> {
    args.forEach(async (channelName) => {
      const channelstring = "#" + channelName;
      await client
        .join(channelstring)
        .then(() => {
          client.sendMsg(
            message.channelId!,
            targetChannel,
            "Added Choob Bot to " + channelName
          );
        })
        .catch((reason) => {
          ChoobLogger.warn(`Failed to join ${channelstring}`, reason);
          client.sendMsg(
            message.channelId!,
            targetChannel,
            "Failed to add Choob Bot to " + channelName
          );
        });
    });
  }
}
