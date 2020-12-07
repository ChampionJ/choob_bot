import { getModelForClass, prop } from "@typegoose/typegoose";
const mongoose = require('mongoose');

export class TwitchGiftedSubsMessage {
  @prop({ required: true, unique: true })
  public message?: string;
  @prop({ required: true, default: false })
  public forMultipleGifts?: boolean;
}
export const TwitchGiftedSubsMessageModel = getModelForClass(TwitchGiftedSubsMessage)
