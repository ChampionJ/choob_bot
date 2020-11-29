
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AddChoobBotToChannelCommand extends BaseCommand {
  constructor() {
    super('addchoobbottochannel', 'admin', []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'AddChoobBotToChannel command works');
  }
}