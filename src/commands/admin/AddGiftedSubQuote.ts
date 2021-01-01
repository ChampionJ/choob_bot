
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchGiftedSubsMessage, TwitchGiftedSubsMessageModel } from '../../database/schemas/TwitchGiftedSubsMessage';
import { stringSimilarity } from '../../utils/stringComparison';
import StateManager from '../../utils/StateManager';
import BaseCommand from '../../utils/structures/BaseCommand';
import { TwitchManager } from '../../utils/TwitchClientManager';

export default class AddGiftedSubMessageCommand extends BaseCommand {
  constructor() {
    super('addgiftmessage', 'admin', 50, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    this.logger.verbose(`${message.userInfo.userName} executed ${this.getName} command in ${targetChannel}`);
    if (args.length < 1) {
      return;
    }
    let newQuote = args.join(" ");

    for (let msgnum = 0; msgnum < StateManager.giftedSubQuotes.length; msgnum++) {
      if (stringSimilarity(StateManager.giftedSubQuotes[msgnum].message!, newQuote) > 0.8) {
        client.say(targetChannel, `That message was too similar to an existing one!`);
        this.logger.info(`* Attempted to add duplicate gifted sub quote.\n\"${newQuote}\"\nmatched\n"${StateManager.giftedSubQuotes[msgnum].message}\"`);
        return;
      }
    }

    await TwitchGiftedSubsMessageModel.create({ message: newQuote, forMultipleGifts: newQuote.includes('{number}') }).then((giftMessage: TwitchGiftedSubsMessage) => {
      this.logger.info(`${message.userInfo.userName} added ${giftMessage.message} to gifted sub message collection!`)
      StateManager.emit('twitchGiftedSubsMessageFetched', giftMessage);
      client.say(targetChannel, `Added ${giftMessage.message} to database!`)
    }).catch((err) => {
      if (err.code !== 11000)
        this.logger.error(`Non-Duplicate error while adding ${newQuote} to database`, err)
      if (err.code === 11000)
        this.logger.error(`Duplicate object error while adding ${newQuote} to database`, err)
    })
  }
}