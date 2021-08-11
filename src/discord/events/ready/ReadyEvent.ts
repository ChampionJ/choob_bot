import BaseEvent from "../../../structures/commands/BaseEvent";
import { ChoobLogger } from "../../../utils/ChoobLogger";
import { DiscordManager } from "../../DiscordClientManager";

export default class ReadyEvent extends BaseEvent {
  constructor() {
    super("ready");
  }
  async run(client: DiscordManager) {
    ChoobLogger.info(
      "Connected to Discord as " +
        client.user?.tag +
        " - (" +
        client.user?.id +
        ")"
    );
  }
}
