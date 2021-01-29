import { mongoose } from '@typegoose/typegoose';
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchCustomCommand, TwitchGlobalSimpleCommand } from '../databaseTypes/schemas/SimpleCommand';
import { TwitchChannelConfigModel } from '../databaseTypes/schemas/TwitchChannelConfig';
import StateManager from '../../utils/StateManager';
import { TwitchManager } from '../../twitch/TwitchClientManager';
import BaseCommand from './BaseCommand';

export class GlobalChoobCommand extends BaseCommand {
  responseString: string;

  constructor(private _data: TwitchGlobalSimpleCommand) {
    super(_data.name!, _data.channelPermissionLevelRequired, undefined, []);
    this.responseString = ParseForStaticVars(_data.response!);
  }
  get data(): TwitchGlobalSimpleCommand { return this._data }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    const replyMessage: string = await ParseForVars(this.responseString, message, targetChannel)
    client.sendMsg(message.channelId!, targetChannel, replyMessage);
    this.logger.verbose(`${message.userInfo.userName} executed ${this._data.name} command in ${targetChannel}`);
  }
}
export default class BaseSimpleCommand extends BaseCommand {
  responseString: string;

  constructor(private _data: TwitchCustomCommand) {
    super(_data.name!, _data.channelPermissionLevelRequired, undefined, []);
    this.responseString = ParseForStaticVars(_data.response!);
  }
  get data(): TwitchCustomCommand { return this._data }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    const replyMessage: string = await ParseForVars(this.responseString, message, targetChannel)
    if (this.data.colorResponse) {
      client.action(targetChannel, replyMessage);
    } else {
      client.sendMsg(message.channelId!, targetChannel, replyMessage);
    }
    this.logger.verbose(`${message.userInfo.userName} executed ${this._data.name} command in ${targetChannel}`);
  }
}

function ParseForStaticVars(inputString: string): string {
  let outString = inputString;
  outString = outString.replace('{choobbotversion}', process.env.npm_package_version!);
  return outString;
}

async function ParseForVars(responseString: string, rawMsgData: TwitchPrivateMessage, targetChannel: string): Promise<string> {
  let outString = responseString;
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