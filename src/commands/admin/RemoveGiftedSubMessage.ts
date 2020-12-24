
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchGiftedSubsMessageModel } from '../../database/schemas/TwitchGiftedSubsMessage';


export default class RemoveGiftedSubMessageCommand extends BaseCommand {
  constructor() {
    super('removegiftmessage', 'admin', 50, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);

    if (args.length < 1) {
      return;
    }

    let removalMessage = args.join(" ");
    let removalIndex: number;
    let shouldRemoveOne = false;
    for (let msgnum = 0; msgnum < StateManager.giftedSubQuotes.length; msgnum++) {
      if (StateManager.giftedSubQuotes[msgnum].message! === removalMessage) {
        removalIndex = msgnum;
        shouldRemoveOne = true;
        break;
      }
    }
    if (shouldRemoveOne) {
      await TwitchGiftedSubsMessageModel.deleteOne({ message: removalMessage }).then((res) => {
        if (res.ok === 1) {
          client.say(targetChannel, `Removed ${removalMessage} from gifted sub message collection!`)
          StateManager.emit('twitchGiftedSubsMessageRemoved', removalIndex, removalMessage);
        }
      })
    } else {
      client.say(targetChannel, `Could not find matching message ${removalMessage} in the collection to remove!`)
    }
  }
}