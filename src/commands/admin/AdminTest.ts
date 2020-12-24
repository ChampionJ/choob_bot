
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('admintest', 'admin', 50, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'AdminTest command works');
    this.logger.debug('AdminTest command works');
    //StateManager.emit('setupDatabaseManually')
  }
}