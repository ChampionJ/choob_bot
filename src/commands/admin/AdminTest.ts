
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChoobRole } from '../../database/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('admintest', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.sendMsg(message.channelId!, targetChannel, 'AdminTest command works');
    this.logger.debug('AdminTest command works');
    //StateManager.emit('setupDatabaseManually')
  }
}