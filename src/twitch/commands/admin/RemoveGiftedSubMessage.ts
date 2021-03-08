
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { TwitchEventMessageGiftedSubsModel } from '../../../structures/databaseTypes/schemas/TwitchGiftedSubsMessage';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/interfaces/ICommand';
import { ChoobRole } from '../../../structures/databaseTypes/interfaces/IUser';


export default class RemoveGiftedSubMessageCommand extends BaseCommand {
  constructor() {
    super('removegiftmessage', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {
    ChoobLogger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);

    if (args.length < 1) {
      return;
    }

    const removalMessage = args.join(" ");
    let removalIndex: number;
    let shouldRemoveOne = false;
    for (let msgnum = 0; msgnum < StateManager.giftedSubQuotes.length; msgnum++) {
      if (StateManager.giftedSubQuotes[msgnum].message! === removalMessage) { // TODO: this should be a percentage match
        removalIndex = msgnum;
        shouldRemoveOne = true;
        break;
      }
    }
    if (shouldRemoveOne) {
      await TwitchEventMessageGiftedSubsModel.deleteOne({ message: removalMessage }).then((res) => {
        if (res.ok === 1) {
          client.sendMsg(message.channelId!, targetChannel, `Removed ${removalMessage} from gifted sub message collection!`)
          StateManager.emit('twitchGiftedSubsMessageRemoved', removalIndex, removalMessage);
        }
      })
    } else {
      client.sendMsg(message.channelId!, targetChannel, `Could not find matching message ${removalMessage} in the collection to remove!`)
    }
  }
}