import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../database/schemas/TwitchChannelConfig';
import { TwitchManager, TwitchMessage } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class RemoveChoobBotFromChannelCommand extends BaseCommand {
  constructor() {
    super('removechoobbotfromchannel', 'admin', 50, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.say(targetChannel, 'RemoveChoobBotFromChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    args.forEach(async channelName => {
      let channelstring = "#" + channelName;
      client.part(channelstring)

      await TwitchChannelConfigModel.findOneAndUpdate({ channelName: channelstring }, { botIsInChannel: false }).then((config) => {
        if (config != null) {
          StateManager.emit('twitchChannelConfigFetched', config)
          client.say(targetChannel, `Choob bot has left ${channelName}.`);
        }
      }).catch(err => this.logger.error(err))


    });
  }
}