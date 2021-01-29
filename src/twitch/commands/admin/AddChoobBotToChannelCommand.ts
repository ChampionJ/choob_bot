
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../TwitchClientManager";
import BaseCommand from '../../../structures/commands/BaseCommand';
import { ChoobRole } from '../../../structures/databaseTypes/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/schemas/SimpleCommand';


export default class AddChoobBotToChannelCommand extends BaseCommand {
  constructor() {
    super('addchoobbottochannel', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {

    args.forEach(async channelName => {
      const channelstring = "#" + channelName;
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