
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AddChoobBotToOwnChannelCommand extends BaseCommand {
  constructor() {
    super('joinchoob', 'choobChannelOnly', 0, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.say(targetChannel, 'AddChoobBotToChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    let channelToJoin = "#" + message.userInfo.userName;
    await client.join(channelToJoin).then(
      () => {
        client.say(targetChannel, 'Added Choob Bot to ' + channelToJoin);
      }
    ).catch(
      (reason) => {
        this.logger.warn(`Failed to join ${channelToJoin}`, reason)
        client.say(targetChannel, 'Failed to add Choob Bot to ' + channelToJoin);
      }
    )
  }
}