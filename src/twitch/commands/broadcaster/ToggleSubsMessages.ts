import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchChannelConfigModel } from '../../../structures/databaseTypes/schemas/TwitchChannelConfig';
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { TCSEventGiftSubListeningModel } from '../../../structures/databaseTypes/schemas/TwitchChannelSettings';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/schemas/SimpleCommand';


export default class ToggleSubsMessagesCommand extends BaseCommand {
  constructor() {
    super('togglesubscriptionchoobs', ChannelPermissionLevel.BROADCASTER, undefined, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    this.logger.debug('Attempting to change setting')
    if (args.length > 0) {
      if (!message.channelId) {
        return;
      }
      let setting;
      if (args[0] === 'on') {
        setting = await TCSEventGiftSubListeningModel.findOneAndUpdate({ channelId: message.channelId }, { isListening: true }, { upsert: true, setDefaultsOnInsert: true, useFindAndModify: false, new: true });
      } else if (args[0] === 'off') {
        setting = await TCSEventGiftSubListeningModel.findOneAndUpdate({ channelId: message.channelId }, { isListening: false }, { upsert: true, setDefaultsOnInsert: true, useFindAndModify: false, new: true });
      }
      if (setting) {
        if (setting.isListening) {
          client.sendMsg(message.channelId!, targetChannel, `Choob Bot will react to new gifted subs!`);
        } else {
          client.sendMsg(message.channelId!, targetChannel, `Choob Bot will no longer react to new gifted subs!`);
        }
      } else {
        client.sendMsg(message.channelId!, targetChannel, `Something went wrong with the request.`);
      }
    }
  }
}