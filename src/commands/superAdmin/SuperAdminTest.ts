
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { TwitchUserModel } from '../../database/schemas/TwitchUsers';
import { stringSimilarity, TwitchManager, TwitchMessage } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AdminTestCommand extends BaseCommand {
  constructor() {
    super('superadmintest', 'superadmin', 100, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'SuperAdminTest command works');
    this.logger.debug('SuperAdminTest command works');
    //StateManager.emit('setupDatabaseManually')


    // let cb = await ChoobMessageModel.find({});
    // cb.forEach(element => {
    //   if (stringSimilarity(element.message!, args.join(' ')) > 0.8) {
    //     //client.say(target, command.duplicateMsg.replace('{username}', context["display-name"]));
    //     this.logger.info(`* Attempted to add duplicate choob quote. \"${args.join(' ')}\" matched \"${element.message!}\"`);
    //     return;
    //   }
    // });

    // let usr = await client.getMods('mcdm');
    // usr.push(...await client.getMods('lord_durok'));

    // usr.forEach(async user => {
    //   await TwitchUserModel.create({ username: user, permissionLevel: 50 })
    //     .then(() => {
    //       this.logger.info(`Added user ${user} to database`)
    //     }).catch((err) => {
    //       if (err.code !== 11000)
    //         this.logger.error(`Non-Duplicate error while creating ${user} user in database`, err)
    //     })
    // });
  }
}