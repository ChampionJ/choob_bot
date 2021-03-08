
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchEventMessageGiftedSubs, TwitchEventMessageGiftedSubsModel } from '../../../structures/databaseTypes/schemas/TwitchGiftedSubsMessage';
import { stringSimilarity } from '../../../utils/stringComparison';
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { TwitchManager } from '../../TwitchClientManager';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/interfaces/ICommand';
import { ChoobRole } from '../../../structures/databaseTypes/interfaces/IUser';
import { ChoobLogger } from '../../../utils/ChoobLogger';
export default class AddGiftedSubMessageCommand extends BaseCommand {
  constructor() {
    super('addgiftmessage', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {
    ChoobLogger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    if (args.length < 1) {
      return;
    }
    const newQuote = args.join(" ");

    for (let msgnum = 0; msgnum < StateManager.giftedSubQuotes.length; msgnum++) {
      if (stringSimilarity(StateManager.giftedSubQuotes[msgnum].message!, newQuote) > 0.8) {
        client.sendMsg(message.channelId!, targetChannel, `That message was too similar to an existing one!`);
        ChoobLogger.info(`* Attempted to add duplicate gifted sub quote.\n"${newQuote}"\nmatched\n"${StateManager.giftedSubQuotes[msgnum].message}"`);
        return;
      }
    }

    const newDoc = new TwitchEventMessageGiftedSubs();
    newDoc.message = newQuote;
    if (newQuote.includes('{number}')) {
      newDoc.minimumGifts = 2;
    }

    await TwitchEventMessageGiftedSubsModel.create(newDoc).then((giftMessage: TwitchEventMessageGiftedSubs) => {
      ChoobLogger.info(`${message.userInfo.userName} added ${giftMessage.message} to gifted sub message collection!`)
      StateManager.emit('twitchGiftedSubsMessageFetched', giftMessage);
      client.sendMsg(message.channelId!, targetChannel, `Added ${giftMessage.message} to database!`)
    }).catch((err) => {
      if (err.code !== 11000)
        ChoobLogger.error(`Non-Duplicate error while adding ${newQuote} to database`, err)
      if (err.code === 11000)
        ChoobLogger.error(`Duplicate object error while adding ${newQuote} to database`, err)
    })
  }
}