
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('modtest', 'moderator', 0, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'Mod-test command works');
  }
}