import { getModelForClass, prop } from "@typegoose/typegoose";
const mongoose = require('mongoose');

export class TwitchTokens {
  @prop({ required: true })
  public accessToken?: string;
  @prop({ required: true })
  public refreshToken?: string;
  @prop({ required: true })
  public expiryTimestamp?: number;
}

export const TwitchTokensModel = getModelForClass(TwitchTokens)