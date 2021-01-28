
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class AddChoobBotToOwnChannelCommand extends BaseCommand {
  constructor() {
    super('joinchoob', ChannelPermissionLevel.CHOOB_CHANNEL, undefined, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.sendMsg(message.channelId!, targetChannel, 'AddChoobBotToChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    let channelToJoin = "#" + message.userInfo.userName;
    await client.join(channelToJoin).then(
      () => {
        client.sendMsg(message.channelId!, targetChannel, 'Added Choob Bot to ' + channelToJoin);
      }
    ).catch(
      (reason) => {
        this.logger.warn(`Failed to join ${channelToJoin}`, reason)
        client.sendMsg(message.channelId!, targetChannel, 'Failed to add Choob Bot to ' + channelToJoin);
      }
    )
  }
}