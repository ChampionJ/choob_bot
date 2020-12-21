import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessage, ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { TwitchChannelConfigModel } from '../../database/schemas/TwitchChannelConfig';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class ChoobBotChannelCount extends BaseCommand {
  constructor() {
    super('choobchannelcount', 'general', 0, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    let choobChannelsCount = await TwitchChannelConfigModel.countDocuments({ botIsInChannel: true });

    client.say(targetChannel, `Choob Bot is in ${choobChannelsCount} channels!`);
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
  }
}