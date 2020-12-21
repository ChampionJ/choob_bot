import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessage, ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class ChoobCommand extends BaseCommand {
  constructor() {
    super('choob', 'general', 0, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {

    //TODO: should cache all the choob quotes locally, so not having to count the entire database. 
    let choobIndexCount = StateManager.choobs.length;
    let choobQuote = StateManager.choobs[Math.floor(Math.random() * choobIndexCount)];

    if (choobQuote) {
      client.say(targetChannel, choobQuote!.message!.replace('{user}', message.userInfo.userName));
      this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    } else {
      this.logger.error(`Attempted ChoobMessage fetch returned no results!`);
    }
  }
}