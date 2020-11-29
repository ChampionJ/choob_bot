
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('modtest', 'moderator', []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'Mod-test command works');
  }
}