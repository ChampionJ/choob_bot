import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../database/schemas/TwitchChannelConfig';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class ChangePrefixCommand extends BaseCommand {
  constructor() {
    super('changechoobprefix', 'channelBroadcaster', 0, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    this.logger.debug('Attempting to change prefix')
    if (args.length > 0) {
      await TwitchChannelConfigModel.findOneAndUpdate({ channelName: targetChannel }, { prefix: args[0] }, {
        new: true, useFindAndModify: false
      }).then((config) => {
        if (config != null) {
          StateManager.emit('twitchChannelConfigFetched', config)
          client.say(targetChannel, `Updated Choob Bot prefix to: ${config.prefix}`);
        }
      }).catch(err => this.logger.error(err))

    }
  }
}