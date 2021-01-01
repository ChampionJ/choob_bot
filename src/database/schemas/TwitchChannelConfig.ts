import { getModelForClass, mongoose, prop } from "@typegoose/typegoose";
import { CustomCommand } from "./SimpleCommand";

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
  public customCommands: Map<string, CustomCommand>;

  constructor() {
    this.customCommands = new Map<string, CustomCommand>();
  }
}
export const TwitchChannelConfigModel = getModelForClass(TwitchChannelConfig)
