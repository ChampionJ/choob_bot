import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../database/schemas/TwitchChannelConfig';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchManager } from '../TwitchClientManager';

export default class BaseSimpleCommand extends BaseCommand {
  responseString: string;
  shouldDMInstead = false;

  constructor(name: string, commandString: string, aliases: string[] = [], sendDMInstead = false) {
    super(name, 'general', 0, aliases);
    this.responseString = this.ParseForStaticVars(commandString);
    this.shouldDMInstead = sendDMInstead;
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {

    const replyMessage: string = await this.ParseForVars(message, targetChannel)
    if (this.shouldDMInstead) {
      client.whisper(message.userInfo.userName, replyMessage);
    } else {
      client.say(targetChannel, replyMessage);
    }
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName()} command in ${targetChannel}`);
  }

  ParseForStaticVars(inputString: string): string {
    let outString = inputString;
    outString = outString.replace('{choobbotversion}', process.env.npm_package_version!);
    return outString;
  }

  async ParseForVars(rawMsgData: TwitchPrivateMessage, targetChannel: string): Promise<string> {
    let outString = this.responseString;
    outString = outString.replace('{username}', rawMsgData.userInfo.userName);
    outString = outString.replace('{displayname}', rawMsgData.userInfo.displayName);
    outString = outString.replace('{channel}', targetChannel.slice(1));
    outString = outString.replace('{choobquotescount}', StateManager.choobs.length.toString());
    if (outString.includes('{choobchannelscount}')) {
      let choobChannelsCount = await TwitchChannelConfigModel.countDocuments({ botIsInChannel: true });
      outString = outString.replace('{choobchannelscount}', choobChannelsCount.toString());
    }
    return outString;
  }
}