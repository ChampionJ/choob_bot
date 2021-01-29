import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../../structures/databaseTypes/schemas/TwitchChannelConfig';
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/schemas/SimpleCommand';


export default class ChangePrefixCommand extends BaseCommand {
  constructor() {
    super('changechoobprefix', ChannelPermissionLevel.BROADCASTER, undefined, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    this.logger.debug('Attempting to change prefix')
    if (args.length > 0) {
      await TwitchChannelConfigModel.findOneAndUpdate({ channelName: targetChannel }, { prefix: args[0] }, {
        new: true, useFindAndModify: false
      }).then((config) => {
        if (config != null) {
          StateManager.emit('twitchChannelConfigFetched', config)
          client.sendMsg(message.channelId!, targetChannel, `Updated Choob Bot prefix to: ${config.prefix}`);
        }
      }).catch(err => this.logger.error(err))

    }
  }
}