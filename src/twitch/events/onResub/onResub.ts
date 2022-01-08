import { logger } from "@typegoose/typegoose/lib/logSettings";
import { ChatCommunitySubInfo, ChatSubInfo, UserNotice } from "@twurple/chat";
import {
  TCSEventGiftSubListeningModel,
  TCSEventResubListeningModel,
} from "../../../structures/databaseTypes/schemas/TwitchChannelSettings";
import { ChoobLogger } from "../../../utils/ChoobLogger";
import StateManager from "../../../utils/StateManager";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { TwitchManager } from "../../TwitchClientManager";

export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super("onResub");
  }
  async run(
    client: TwitchManager,
    channel: string,
    username: string,
    subInfo: ChatSubInfo,
    userNotice: UserNotice
  ): Promise<void> {
    ChoobLogger.info(
      `${username} resubscribed to ${channel} for the ${subInfo.months} month. Also a streak:? ${subInfo.streak}`
    );

    if (userNotice.channelId) {
      ChoobLogger.debug(
        `attempting to get settings for ${userNotice.channelId}`
      );
      const listenSettings = await TCSEventResubListeningModel.findOne({
        channelId: userNotice.channelId,
      });

      if (listenSettings?.isListening) {
        //client.sendMsg(userNotice.channelId, channel, `The Great Choob thanks you for resubscribing!`)
        // setTimeout(async () => {
        //   // giftQuote: TwitchEventMessageGiftedSubs | null;// = localdata.giftedsubs[0];
        //   const filteredQuotes = StateManager.giftedSubQuotes.filter(val => val.minimumGifts <= subInfo.count);
        //   const giftQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)]
        //   if (giftQuote) {
        //     client.sendMsg(userNotice.channelId!, channel, giftQuote!.message!.replace('{gifter}', username).replace('{number}', subInfo.count.toString()));
        //   } else {
        //     logger.error(`Attempted TwitchSubGiftedSubsMessage fetch returned no results!`);
        //   }
        // }, subInfo.count * 200 + 1000);
      }
    }
  }
}
