import { logger } from "@typegoose/typegoose/lib/logSettings";
import { ChatCommunitySubInfo, UserNotice } from "twitch-chat-client/lib";
import { TCSEventGiftSubListeningModel } from "../../database/schemas/TwitchChannelSettings";
import { TwitchEventMessage, TwitchEventMessageGiftedSubs } from "../../database/schemas/TwitchGiftedSubsMessage";
import StateManager from "../../utils/StateManager";
import BaseEvent from "../../utils/structures/BaseEvent";
import { TwitchManager } from "../../utils/TwitchClientManager";



export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('onCommunitySub');
  }
  async run(client: TwitchManager, channel: string, username: string, subInfo: ChatCommunitySubInfo, userNotice: UserNotice) {
    this.logger.info(`There were ${subInfo.count} subs gifted in ${channel} by ${username}`);

    const channelConfig = StateManager.twitchChannelConfigs.get(channel);
    if (channelConfig && userNotice.channelId) {
      const giftListenSettings = await TCSEventGiftSubListeningModel.findOne({ channelId: userNotice.channelId })
      if (giftListenSettings?.isListening) {
        setTimeout(async () => {

          let giftQuote: TwitchEventMessageGiftedSubs | null;// = localdata.giftedsubs[0];
          const filteredQuotes = StateManager.giftedSubQuotes.filter(val => val.minimumGifts <= subInfo.count);
          giftQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)]

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