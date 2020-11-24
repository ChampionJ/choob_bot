import { TwitchManager, TwitchMessage } from "../../types";
import BaseEvent from "../../utils/structures/BaseEvent";

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }

  async run(client: TwitchManager, message: TwitchMessage) {
    if (message.self) return;
    if (message.msg.startsWith(client.prefix)) {
      const [cmdName, ...cmdArgs] = message.msg
        .slice(client.prefix.length)
        .trim()
        .split(/\s+/);
      const command = client.commands.get(cmdName);
      if (command) {
        command.run(client, message, cmdArgs);
      }
    }
  }
}