import { logger } from "@typegoose/typegoose/lib/logSettings";
import { ChatCommunitySubInfo, UserNotice } from "twitch-chat-client/lib";
import { TwitchGiftedSubsMessage, TwitchGiftedSubsMessageModel } from "../../database/schemas/TwitchGiftedSubsMessage";
import { TwitchManager } from "../../types";
import StateManager from "../../utils/StateManager";
import BaseEvent from "../../utils/structures/BaseEvent";



export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('onCommunitySub');
  }
  async run(client: TwitchManager, channel: string, username: string, subInfo: ChatCommunitySubInfo, userNotice: UserNotice) {
    this.logger.info(`There were ${subInfo.count} gifted in ${channel} by ${username}`);

    const channelConfig = StateManager.twitchChannelConfigs.get(channel);
    if (channelConfig) {
      setTimeout(async () => {
        //localdata.giftedsubs.length;
        let giftQuote: TwitchGiftedSubsMessage | null;// = localdata.giftedsubs[0];
        if (subInfo.count > 1) {
          //giftQuote = localdata.giftedsubs[Math.floor(Math.random() * giftIndexCount)];
          let giftIndexCount = await TwitchGiftedSubsMessageModel.estimatedDocumentCount();
          giftQuote = await TwitchGiftedSubsMessageModel.findOne({}).skip(Math.floor(Math.random() * giftIndexCount))
        } else {
          let giftIndexCount = await TwitchGiftedSubsMessageModel.countDocuments({ forMultipleGifts: false })
          giftQuote = await TwitchGiftedSubsMessageModel.findOne({ forMultipleGifts: false }).skip(Math.floor(Math.random() * giftIndexCount))
        }
        if (giftQuote) {
          client.say(channel, giftQuote!.message!.replace('{gifter}', username).replace('{number}', subInfo.count.toString()));
        } else {
          logger.error(`Attempted TwitchSubGiftedSubsMessage fetch returned no results!`);
        }
      }, subInfo.count * 200 + 1000);
    }
  }
}