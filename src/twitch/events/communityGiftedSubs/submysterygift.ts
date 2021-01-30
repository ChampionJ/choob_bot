import { logger } from "@typegoose/typegoose/lib/logSettings";
import { ChatCommunitySubInfo, UserNotice } from "twitch-chat-client/lib";
import { TCSEventGiftSubListeningModel, TCSEventGiftSubOptionsModel } from "../../../structures/databaseTypes/schemas/TwitchChannelSettings";
import { TwitchEventMessage, TwitchEventMessageGiftedSubs } from "../../../structures/databaseTypes/schemas/TwitchGiftedSubsMessage";
import { ChoobLogger } from "../../../utils/ChoobLogger";
import StateManager from "../../../utils/StateManager";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { TwitchManager } from "../../TwitchClientManager";



export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('onCommunitySub');
  }
  async run(client: TwitchManager, channel: string, username: string, subInfo: ChatCommunitySubInfo, userNotice: UserNotice): Promise<void> {
    this.logger.verbose(`There were ${subInfo.count} subs gifted in ${channel} by ${username}`);

    if (userNotice.channelId) {
      ChoobLogger.debug(`attempting to get settings for ${userNotice.channelId}`)
      const giftListenSettings = await TCSEventGiftSubListeningModel.findOne({ channelId: userNotice.channelId })

      if (giftListenSettings?.isListening) {

        const giftChannelOptions = await TCSEventGiftSubOptionsModel.findOne({ channelId: userNotice.channelId })
        if (giftChannelOptions && giftChannelOptions.minimumNumOfSubs >= subInfo.count) {

          setTimeout(async () => {

            // giftQuote: TwitchEventMessageGiftedSubs | null;// = localdata.giftedsubs[0];
            const filteredQuotes = StateManager.giftedSubQuotes.filter(val => val.minimumGifts <= subInfo.count);
            const giftQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)]

            if (giftQuote) {
              client.sendMsg(userNotice.channelId!, channel, giftQuote!.message!.replace('{gifter}', username).replace('{number}', subInfo.count.toString()));
            } else {
              logger.error(`Attempted TwitchSubGiftedSubsMessage fetch returned no results!`);
            }
          }, subInfo.count * 200 + 1000);
        }
      }
    }
  }
}