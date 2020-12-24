import { getModelForClass, mongoose, prop } from "@typegoose/typegoose";

export class TwitchUser {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public username?: string;
  @prop({ required: true, default: 0 })
  public permissionLevel?: number;
}
export const TwitchUserModel = getModelForClass(TwitchUser)
