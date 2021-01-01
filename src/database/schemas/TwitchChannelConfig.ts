import { getModelForClass, mongoose, prop } from "@typegoose/typegoose";
import { TwitchCustomCommand } from "./SimpleCommand";

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
  @prop({ type: Map })
  public customCommands: Map<string, TwitchCustomCommand>;

  constructor() {
    this.customCommands = new Map<string, TwitchCustomCommand>();
  }
}
export const TwitchChannelConfigModel = getModelForClass(TwitchChannelConfig)
