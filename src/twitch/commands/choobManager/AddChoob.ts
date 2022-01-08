import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import {
  ChoobQuote,
  ChoobQuoteModel,
} from "../../../structures/databaseTypes/schemas/ChoobMessage";
import { stringSimilarity } from "../../../utils/stringComparison";
import StateManager from "../../../utils/StateManager";
import { BaseTwitchCommand } from "../../../structures/commands/BaseCommand";
import { TwitchManager } from "../../TwitchClientManager";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { ChoobLogger } from "../../../utils/ChoobLogger";
export default class AddChoobCommand extends BaseTwitchCommand {
  constructor() {
    super("addchoob", ChannelPermissionLevel.GENERAL, ChoobRole.ADDCHOOB, []);
  }

  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ): Promise<void> {
    if (args.length < 1) {
      return;
    }

    const newChoob = args.join(" ");
    for (let msgnum = 0; msgnum < StateManager.choobs.length; msgnum++) {
      if (
        stringSimilarity(StateManager.choobs[msgnum].quote!, newChoob) > 0.8
      ) {
        client.sendMsg(
          message.channelId!,
          targetChannel,
          `That choob was too similar to an existing choob!`
        );
        ChoobLogger.info(
          `* Attempted to add duplicate choob quote.\n"${newChoob}"\nmatched\n"${StateManager.choobs[msgnum].quote}"`
        );
        return;
      }
    }

    const choob = new ChoobQuoteModel({
      quote: newChoob,
      author: message.userInfo.displayName,
      authorId: message.userInfo.userId,
    });
    await choob
      .save()
      .then((choobMessage: mongoose.Document) => {
        const choobMsg = choobMessage as DocumentType<ChoobQuote>;
        ChoobLogger.info(
          `${message.userInfo.userName} added ${choobMsg.quote} to choob collection!`
        );
        StateManager.emit("choobFetched", choobMessage);
        client.sendMsg(
          message.channelId!,
          targetChannel,
          `Added ${choobMsg.quote} to database!`
        );
      })
      .catch((err) => {
        if (err.code !== 11000)
          ChoobLogger.error(
            `Non-Duplicate error while adding ${newChoob} to database`,
            err
          );
        if (err.code === 11000)
          ChoobLogger.error(
            `Duplicate object error while adding ${newChoob} to database`,
            err
          );
      });
  }
}
