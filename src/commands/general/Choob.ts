import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class ChoobCommand extends BaseCommand {
  constructor() {
    super('choob', ChannelPermissionLevel.GENERAL, undefined, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {


    let choobIndexCount = StateManager.choobs.length;
    let choobQuote = StateManager.choobs[Math.floor(Math.random() * choobIndexCount)];

    if (choobQuote) {
      client.sendMsg(message.channelId!, targetChannel, choobQuote!.quote!.replace('{user}', message.userInfo.userName));
      this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    } else {
      this.logger.error(`Attempted ChoobMessage fetch returned no results!`);
    }
  }
}