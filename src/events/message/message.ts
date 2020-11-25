import { Userstate } from "tmi.js";
import winston from "winston";
import { TwitchManager, TwitchMessage } from "../../types";
import BaseEvent from "../../utils/structures/BaseEvent";
const logger = winston.loggers.get('main');

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }

  async run(client: TwitchManager, target: string, user: Userstate, msg: string, self: boolean) {
    let message: TwitchMessage = new TwitchMessage(client, target, user, msg, self)
    logger.debug(`${message.target} | ${message.user["display-name"]}: ${message.msg}`)

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