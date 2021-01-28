
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('modtest', ChannelPermissionLevel.MODERATOR, undefined, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.sendMsg(message.channelId!, targetChannel, 'Mod-test command works');
  }
}