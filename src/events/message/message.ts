import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import TwitchChannelConfig from "../../database/schemas/TwitchChannelConfig";
import { TwitchManager } from "../../types";
import StateManager from "../../utils/StateManager";
import BaseEvent from "../../utils/structures/BaseEvent";

const twitchChannelCommandPrefixes = new Map();

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('onMessage');

  }

  async run(client: TwitchManager, targetChannel: string, user: string, message: string, msgRaw: TwitchPrivateMessage) {

    //let message: TwitchMessage = new TwitchMessage(client, targetChannel, msgRaw.userInfo, msg, self)
    this.logger.debug(`${targetChannel} | ${user}: ${message}`)

    //if () return;

    const prefix = twitchChannelCommandPrefixes.get(targetChannel) || '!';

    if (message.startsWith(prefix)) {
      const [cmdName, ...cmdArgs] = message
        .slice(prefix.length)
        .trim()
        .split(/\s+/);
      const command = client.commands.get(cmdName.toLowerCase().replace(/-/g, ""));
      if (command) {
        this.logger.debug('triggered: ' + command.getName())
        if (command.getCategory() === 'admin') {
          await TwitchChannelConfig.findOne({ channelName: targetChannel }).then((config) => {
            // this.logger.debug('Admin command check', config)
            if (config!.adminChannel!) {
              command.run(client, targetChannel, msgRaw, cmdArgs);
            }
          }).catch(err => this.logger.error(err))
        } else if (command.getCategory() === 'moderator') {
          if (msgRaw.userInfo.isMod || msgRaw.userInfo.isBroadcaster) {
            command.run(client, targetChannel, msgRaw, cmdArgs);
          }
        } else {
          command.run(client, targetChannel, msgRaw, cmdArgs);
        }
      }
    }
  }
}
StateManager.on('twitchChannelPrefixFetched', (channel, prefix) => {
  console.log(`Fetched prefix for ${channel}: \"${prefix}\"`)
  twitchChannelCommandPrefixes.set(channel, prefix)
})

