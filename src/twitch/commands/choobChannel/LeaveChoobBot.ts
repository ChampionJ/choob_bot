import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../../structures/databaseTypes/schemas/TwitchChannelConfig';
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/schemas/SimpleCommand';


export default class RemoveChoobBotFromOwnChannelCommand extends BaseCommand {
  constructor() {
    super('leavechoob', ChannelPermissionLevel.CHOOB_CHANNEL, undefined, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {
    //client.sendMsg(message.channelId!, targetChannel, 'RemoveChoobBotFromChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    const channelToLeave = "#" + message.userInfo.userName;

    client.part(channelToLeave)

    await TwitchChannelConfigModel.findOneAndUpdate({ channelName: channelToLeave }, { botIsInChannel: false }, { useFindAndModify: false }).then((config) => {
      if (config != null) {
        StateManager.emit('twitchChannelConfigFetched', config)
        client.sendMsg(message.channelId!, targetChannel, `Choob bot has left ${channelToLeave}.`);
      }
    }).catch(err => this.logger.error(err))



  }
}