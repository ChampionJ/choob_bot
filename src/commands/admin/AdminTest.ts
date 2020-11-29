
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('admintest', 'admin', []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'AdminTest command works');
    this.logger.debug(message.channelId!);
    this.logger.debug(args)
    this.logger.debug(client.commands.size.toString())
  }
}