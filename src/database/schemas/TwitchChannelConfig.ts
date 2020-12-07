import { getModelForClass, prop } from "@typegoose/typegoose";
const mongoose = require('mongoose');

export class TwitchChannelConfig {
  @prop({ required: true, unique: true })
  public channelName?: string;
  @prop({ required: true, default: '!' })
  public prefix?: string;
  @prop({ required: true, default: false })
  public adminChannel?: boolean;
  @prop({ required: true, default: false })
  public reactToGiftedSubs?: boolean;
}
export const TwitchChannelConfigModel = getModelForClass(TwitchChannelConfig)
