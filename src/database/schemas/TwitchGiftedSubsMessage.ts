import { getModelForClass, mongoose, prop } from "@typegoose/typegoose";

export class TwitchGiftedSubsMessage {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public message?: string;
  @prop({ required: true, default: false })
  public forMultipleGifts?: boolean;
}
export const TwitchGiftedSubsMessageModel = getModelForClass(TwitchGiftedSubsMessage)
