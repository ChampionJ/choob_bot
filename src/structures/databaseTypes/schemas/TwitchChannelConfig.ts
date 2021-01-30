import { getModelForClass, modelOptions, mongoose, prop } from "@typegoose/typegoose";
import { TwitchCustomCommand } from "./SimpleCommand";

@modelOptions({ schemaOptions: { collection: 'twitch_channel_configs' } })
export class TwitchChannelConfig {

  //? Identity

  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public identifier!: string;
  @prop({ required: true })
  public channelName?: string;

  //? Core Info
  @prop({ required: true, default: true })
  public botIsInChannel?: boolean;

  //? Global Settings
  @prop({ required: true, default: '!' })
  public prefix?: string;
  @prop({ required: true, default: false })
  public colorAllMessages?: boolean;

}
export const TwitchChannelConfigModel = getModelForClass(TwitchChannelConfig)

