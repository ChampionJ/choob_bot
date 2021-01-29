
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { ChoobRole } from '../../../structures/databaseTypes/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/schemas/SimpleCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('admintest', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {
    client.sendMsg(message.channelId!, targetChannel, 'AdminTest command works');
    this.logger.debug('AdminTest command works');
    StateManager.emit('setupDatabaseManually', args[0])
  }
}