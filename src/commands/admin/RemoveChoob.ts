
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobMessage, ChoobMessageModel } from '../../database/schemas/ChoobMessage';
import { stringSimilarity, TwitchManager, TwitchMessage } from '../../types';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';


export default class RemoveChoobCommand extends BaseCommand {
  constructor() {
    super('removechoob', 'admin', 50, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    //client.say(targetChannel, 'AddChoobBotToChannel command works');
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);

    if (args.length < 1) {
      return;
    }

    let removalChoob = args.join(" ");
    let removalIndex: number;
    let shouldRemoveOne = false;
    for (let msgnum = 0; msgnum < StateManager.choobs.length; msgnum++) {
      if (StateManager.choobs[msgnum].message! === removalChoob) {
        removalIndex = msgnum;
        shouldRemoveOne = true;
        break;
      }
    }
    if (shouldRemoveOne) {
      await ChoobMessageModel.deleteOne({ message: removalChoob }).then((res) => {
        if (res.ok === 1) {
          client.say(targetChannel, `Removed ${removalChoob} from choob collection!`)
          StateManager.emit('choobRemoved', removalIndex);
        }
      })
    } else {
      client.say(targetChannel, `Could not find matching choob ${removalChoob} in the collection to remove!`)
    }
  }
}