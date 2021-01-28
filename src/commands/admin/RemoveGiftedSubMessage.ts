
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchEventMessageGiftedSubsModel } from '../../database/schemas/TwitchGiftedSubsMessage';
import { ChoobRole } from '../../database/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class RemoveGiftedSubMessageCommand extends BaseCommand {
  constructor() {
    super('removegiftmessage', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
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