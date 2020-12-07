import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessage, ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class ChoobCommand extends BaseCommand {
  constructor() {
    super('choob', 'general', []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    let choobIndexCount = await ChoobMessageModel.estimatedDocumentCount();
    let choobQuote = await ChoobMessageModel.findOne({}).skip(Math.floor(Math.random() * choobIndexCount))

    if (choobQuote) {
      client.say(targetChannel, choobQuote!.message!.replace('{user}', message.userInfo.userName));
      this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    } else {
      this.logger.error(`Attempted ChoobMessage fetch returned no results!`);
    }



  }
}