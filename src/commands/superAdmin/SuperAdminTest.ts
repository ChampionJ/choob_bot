
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { stringSimilarity, TwitchManager, TwitchMessage } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('superadmintest', 'superadmin', []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'SuperAdminTest command works');
    this.logger.debug(message.channelId!);
    this.logger.debug(args)
    this.logger.debug(client.commands.size.toString())
    //StateManager.emit('setupDatabaseManually')


    let cb = await ChoobMessageModel.find({});
    cb.forEach(element => {
      if (stringSimilarity(element.message!, args.join(' ')) > 0.8) {
        //client.say(target, command.duplicateMsg.replace('{username}', context["display-name"]));
        this.logger.info(`* Attempted to add duplicate choob quote. \"${args.join(' ')}\" matched \"${element.message!}\"`);
        return;
      }
    });
  }
}