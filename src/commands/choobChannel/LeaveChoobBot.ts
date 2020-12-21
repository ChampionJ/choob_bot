import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../database/schemas/TwitchChannelConfig';
import { TwitchManager, TwitchMessage } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class RemoveChoobBotFromOwnChannelCommand extends BaseCommand {
  constructor() {
    super('leavechoob', 'choobChannelOnly', 0, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.say(targetChannel, 'RemoveChoobBotFromChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    let channelToLeave = "#" + message.userInfo.userName;

    client.part(channelToLeave)

    await TwitchChannelConfigModel.findOneAndUpdate({ channelName: channelToLeave }, { botIsInChannel: false }).then((config) => {
      if (config != null) {
        StateManager.emit('twitchChannelConfigFetched', config)
        client.say(targetChannel, `Choob bot has left ${channelToLeave}.`);
      }
    }).catch(err => this.logger.error(err))



  }
}