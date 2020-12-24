import { getModelForClass, mongoose, prop } from "@typegoose/typegoose";

export class TwitchChannelConfig {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public channelName?: string;
  @prop({ required: true, default: '!' })
  public prefix?: string;
  @prop({ required: true, default: false })
  public adminChannel?: boolean;
  @prop({ required: true, default: true })
  public botIsInChannel?: boolean;
  @prop({ required: true, default: false })
  public reactToGiftedSubs?: boolean;
}
export const TwitchChannelConfigModel = getModelForClass(TwitchChannelConfig)
