
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobQuote, ChoobQuoteModel } from '../../database/schemas/ChoobMessage';
import { TwitchManager } from "../../utils/TwitchClientManager";
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { ChoobRole } from '../../database/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../database/schemas/SimpleCommand';


export default class RemoveChoobCommand extends BaseCommand {
  constructor() {
    super('removechoob', ChannelPermissionLevel.GENERAL, ChoobRole.REMOVECHOOB, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {

    if (args.length < 1) {
      return;
    }

    let removalChoob = args.join(" ");
    let removalIndex: number;
    let shouldRemoveOne = false;
    for (let msgnum = 0; msgnum < StateManager.choobs.length; msgnum++) {
      if (StateManager.choobs[msgnum].quote! === removalChoob) { // TODO this should be a percentage match
        removalIndex = msgnum;
        shouldRemoveOne = true;
        break;
      }
    }
    if (shouldRemoveOne) {
      await ChoobQuoteModel.deleteOne({ quote: removalChoob }).then((res) => {
        if (res.ok === 1) {
          client.sendMsg(message.channelId!, targetChannel, `Removed ${removalChoob} from choob collection!`)
        }
      })
    } else {
      client.sendMsg(message.channelId!, targetChannel, `Could not find matching choob ${removalChoob} in the collection to remove!`)
    }
  }
}