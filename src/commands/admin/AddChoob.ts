
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessage, ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { stringSimilarity } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchManager } from '../../utils/TwitchClientManager';


export default class AddChoobCommand extends BaseCommand {
  constructor() {
    super('addchoob', 'admin', 50, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.say(targetChannel, 'AddChoobBotToChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);

    if (args.length < 1) {
      return;
    }

    let newChoob = args.join(" ");



    for (let msgnum = 0; msgnum < StateManager.choobs.length; msgnum++) {
      if (stringSimilarity(StateManager.choobs[msgnum].message!, newChoob) > 0.8) {
        client.say(targetChannel, `That choob was too similar to an existing choob!`);
        this.logger.info(`* Attempted to add duplicate choob quote.\n\"${newChoob}\"\nmatched\n"${StateManager.choobs[msgnum].message}\"`);
        return;
      }
    }

    await ChoobMessageModel.create({ message: newChoob }).then((choobMessage: ChoobMessage) => {
      this.logger.info(`${message.userInfo.userName} added ${choobMessage.message} to choob collection!`)
      StateManager.emit('choobFetched', choobMessage);
      client.say(targetChannel, `Added ${choobMessage.message} to database!`)
    }).catch((err) => {
      if (err.code !== 11000)
        this.logger.error(`Non-Duplicate error while adding ${newChoob} to database`, err)
      if (err.code === 11000)
        this.logger.error(`Duplicate object error while adding ${newChoob} to database`, err)
    })

  }
}