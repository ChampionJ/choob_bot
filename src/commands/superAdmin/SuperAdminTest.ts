
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchManager } from '../../utils/TwitchClientManager';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('superadmintest', 'superadmin', 100, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'SuperAdminTest command works');
    this.logger.debug('SuperAdminTest command works');
    StateManager.emit('setupDatabaseManually')
  }
}