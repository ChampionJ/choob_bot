
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { ChoobQuote, ChoobQuoteModel } from '../../../structures/databaseTypes/schemas/ChoobMessage';
import { stringSimilarity } from '../../../utils/stringComparison';
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { TwitchManager } from '../../TwitchClientManager';
import { ChoobRole } from '../../../structures/databaseTypes/schemas/TwitchUsers';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/schemas/SimpleCommand';

export default class AddChoobCommand extends BaseCommand {
  constructor() {
    super('addchoob', ChannelPermissionLevel.GENERAL, ChoobRole.ADDCHOOB, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {
    if (args.length < 1) {
      return;
    }

    const newChoob = args.join(" ");
    for (let msgnum = 0; msgnum < StateManager.choobs.length; msgnum++) {
      if (stringSimilarity(StateManager.choobs[msgnum].quote!, newChoob) > 0.8) {
        client.sendMsg(message.channelId!, targetChannel, `That choob was too similar to an existing choob!`);
        this.logger.info(`* Attempted to add duplicate choob quote.\n"${newChoob}"\nmatched\n"${StateManager.choobs[msgnum].quote}"`);
        return;
      }
    }

    const choob = new ChoobQuoteModel({ quote: newChoob, author: message.userInfo.displayName, authorId: message.userInfo.userId })
    await choob.save().then((choobMessage: ChoobQuote) => {
      this.logger.info(`${message.userInfo.userName} added ${choobMessage.quote} to choob collection!`)
      StateManager.emit('choobFetched', choobMessage);
      client.sendMsg(message.channelId!, targetChannel, `Added ${choobMessage.quote} to database!`)
    }).catch((err) => {
      if (err.code !== 11000)
        this.logger.error(`Non-Duplicate error while adding ${newChoob} to database`, err)
      if (err.code === 11000)
        this.logger.error(`Duplicate object error while adding ${newChoob} to database`, err)
    })
  }
}