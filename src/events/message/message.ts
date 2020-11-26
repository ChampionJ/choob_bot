import { Userstate } from "tmi.js";
import TwitchChannelConfig from "../../database/schemas/ChannelConfig";
import { TwitchManager, TwitchMessage } from "../../types";
import BaseEvent from "../../utils/structures/BaseEvent";


export default class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }

  async run(client: TwitchManager, target: string, user: Userstate, msg: string, self: boolean) {
    let message: TwitchMessage = new TwitchMessage(client, target, user, msg, self)
    this.logger.debug(`${message.target} | ${message.user["display-name"]}: ${message.msg}`)

    if (message.self) return;

    //TODO: cache all database info for channels and then check for prefix
    //const channelConfig = await ChannelConfig.findOne({ channelName: target }); // this checks database every msg, which is a *lot*
    //const prefix = channelConfig?.get('prefix')

    const prefix = '!'

    if (message.msg.startsWith(prefix)) {
      const [cmdName, ...cmdArgs] = message.msg
        .slice(prefix.length)
        .trim()
        .split(/\s+/);
      const command = client.commands.get(cmdName);
      if (command) {
        command.run(client, message, cmdArgs);
      }
    }
  }
}