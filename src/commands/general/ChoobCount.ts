import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessage, ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class ChoobCountCommand extends BaseCommand {
  constructor() {
    super('choobcount', 'general', 0, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    let choobIndexCount = await ChoobMessageModel.estimatedDocumentCount();
    client.say(targetChannel, `There are ${choobIndexCount} choobs in the database!`);
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
  }
}
