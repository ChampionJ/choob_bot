import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { TwitchChannelConfigModel } from "../../../structures/databaseTypes/schemas/TwitchChannelConfig";
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from "../../../utils/StateManager";
import { BaseTwitchCommand } from "../../../structures/commands/BaseCommand";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobLogger } from "../../../utils/ChoobLogger";
export default class ChangePrefixCommand extends BaseTwitchCommand {
  constructor() {
    super(
      "changechoobprefix",
      ChannelPermissionLevel.BROADCASTER,
      undefined,
      []
    );
  }
  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ) {
    ChoobLogger.debug("Attempting to change prefix");
    if (args.length > 0) {
      await TwitchChannelConfigModel.findOneAndUpdate(
        { channelName: targetChannel },
        { prefix: args[0] },
        {
          new: true,
          useFindAndModify: false,
        }
      )
        .then((config) => {
          if (config != null) {
            StateManager.emit("twitchChannelConfigFetched", config);
            client.sendMsg(
              message.channelId!,
              targetChannel,
              `Updated Choob Bot prefix to: ${config.prefix}`
            );
          }
        })
        .catch((err) => ChoobLogger.error(err));
    }
  }
}
