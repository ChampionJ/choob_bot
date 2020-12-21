
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager, TwitchMessage } from '../../types';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class AddChoobBotToChannelCommand extends BaseCommand {
  constructor() {
    super('addchoobbottochannel', 'admin', 50, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.say(targetChannel, 'AddChoobBotToChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    args.forEach(async channelName => {
      let channelstring = "#" + channelName;
      await client.join(channelstring).then(
        () => {
          client.say(targetChannel, 'Added Choob Bot to ' + channelName);
        }
      ).catch(
        (reason) => {
          this.logger.warn(`Failed to join ${channelstring}`, reason)
          client.say(targetChannel, 'Failed to add Choob Bot to ' + channelName);
        }
      )
    });

    // if (localdata.connectionSettings.channels!.includes(channelstring)) {
    //   tclient.say(target, command.existsMessage.replace('{channel}', channelToJoin));
    //   logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelToJoin}, but Choob_Bot is already in that channel`);
    // } else {
    //   tclient.join(channelstring)
    //     .then(() => {
    //       localdata.connectionSettings.channels!.push(channelstring);
    //       fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: Error) => { if (e != null) this.logger.log('error', e); });
    //       tclient.say(target, command.joinMessage.replace('{channel}', channelToJoin));
    //       logger.log('info', `${context["display-name"]} added Choob_Bot to ${channelToJoin}`);

    //     })
    //     .catch(() => {
    //       tclient.say(target, command.doesntExist.replace('{channel}', channelToJoin));
    //       this.logger.info(`${context["display-name"]} attempted to add Choob_Bot to ${channelToJoin}, but that channel doesn\'t exist`);
    //     });
    // }
    // this.logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);

  }
}