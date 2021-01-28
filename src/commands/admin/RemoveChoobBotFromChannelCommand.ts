import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../database/schemas/TwitchChannelConfig';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChoobRole } from '../../database/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class RemoveChoobBotFromChannelCommand extends BaseCommand {
  constructor() {
    super('removechoobbotfromchannel', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    args.forEach(async channelName => {
      let channelstring = "#" + channelName;
      client.part(channelstring)

      await TwitchChannelConfigModel.findOneAndUpdate({ channelName: channelstring }, { botIsInChannel: false }).then((config) => {
        if (config != null) {
          StateManager.emit('twitchChannelConfigFetched', config)
          client.sendMsg(message.channelId!, targetChannel, `Choob bot has left ${channelName}.`);
        }
      }).catch(err => this.logger.error(err))


    });
  }
}