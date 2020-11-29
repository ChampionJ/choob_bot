import { logger } from "@typegoose/typegoose/lib/logSettings";
import { ChatCommunitySubInfo, UserNotice } from "twitch-chat-client/lib";
import { TwitchManager } from "../../types";
import BaseEvent from "../../utils/structures/BaseEvent";

export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('onCommunitySub');
  }
  async run(client: TwitchManager, channel: string, username: string, subInfo: ChatCommunitySubInfo, userNotice: UserNotice) {
    this.logger.info(`There were ${subInfo.count} gifted in ${channel} by ${username}`);
  }
}