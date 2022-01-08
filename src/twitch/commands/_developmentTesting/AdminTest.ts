import { TwitchManager } from "../../TwitchClientManager";
import StateManager from "../../../utils/StateManager";
import { BaseTwitchCommand } from "../../../structures/commands/BaseCommand";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";
import { ChoobLogger } from "../../../utils/ChoobLogger";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";

export default class AdminTestCommand extends BaseTwitchCommand {
  constructor() {
    super("admintest", ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }
  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ): Promise<void> {
    client.sendMsg(
      message.channelId!,
      message.target.value,
      "AdminTest command works"
    );
    ChoobLogger.debug("AdminTest command works");
    StateManager.emit("setupDatabaseManually", args[0]);
  }
}
