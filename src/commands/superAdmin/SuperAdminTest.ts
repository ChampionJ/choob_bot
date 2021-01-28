
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';
import { ChoobRole } from '../../database/schemas/TwitchUsers';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchManager } from '../../utils/TwitchClientManager';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('superadmintest', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.sendMsg(message.channelId!, targetChannel, 'SuperAdminTest command works');
    this.logger.debug('SuperAdminTest command works');
    StateManager.emit('setupDatabaseManually', args[0])
  }
}