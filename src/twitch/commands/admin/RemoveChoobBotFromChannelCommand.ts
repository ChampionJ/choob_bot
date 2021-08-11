import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { TwitchChannelConfigModel } from "../../../structures/databaseTypes/schemas/TwitchChannelConfig";
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from "../../../utils/StateManager";
import { BaseTwitchCommand } from "../../../structures/commands/BaseCommand";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";
import { ChoobLogger } from "../../../utils/ChoobLogger";

export default class RemoveChoobBotFromChannelCommand extends BaseTwitchCommand {
  constructor() {
    super(
      "removechoobbotfromchannel",
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
    ChoobLogger.verbose(
      `${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`
    );
    args.forEach(async (channelName) => {
      const channelstring = "#" + channelName;
      client.part(channelstring);

      await TwitchChannelConfigModel.findOneAndUpdate(
        { channelName: channelstring },
        { botIsInChannel: false }
      )
        .then((config) => {
          if (config != null) {
            StateManager.emit("twitchChannelConfigFetched", config);
            client.sendMsg(
              message.channelId!,
              targetChannel,
              `Choob bot has left ${channelName}.`
            );
          }
        })
        .catch((err) => ChoobLogger.error(err));
    });
  }
}
