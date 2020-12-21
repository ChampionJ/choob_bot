import { getModelForClass, prop } from "@typegoose/typegoose";
const mongoose = require('mongoose');

export class TwitchUser {
  @prop({ required: true, unique: true })
  public username?: string;
  @prop({ required: true, default: 0 })
  public permissionLevel?: number;
}
export const TwitchUserModel = getModelForClass(TwitchUser)
