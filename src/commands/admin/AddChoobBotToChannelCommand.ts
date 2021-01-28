
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChoobRole } from '../../database/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class AddChoobBotToChannelCommand extends BaseCommand {
  constructor() {
    super('addchoobbottochannel', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    args.forEach(async channelName => {
      let channelstring = "#" + channelName;
      await client.join(channelstring).then(
        () => {
          client.sendMsg(message.channelId!, targetChannel, 'Added Choob Bot to ' + channelName);
        }
      ).catch(
        (reason) => {
          this.logger.warn(`Failed to join ${channelstring}`, reason)
          client.sendMsg(message.channelId!, targetChannel, 'Failed to add Choob Bot to ' + channelName);
        }
      )
    });
  }
}