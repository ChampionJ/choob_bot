import { getModelForClass, modelOptions, mongoose, prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: 'api_tokens' } })
export class APIToken {
  _id!: mongoose.Types.ObjectId;
  @prop({ type: String, required: true, unique: true })
  identifier!: string;
  @prop({ required: true })
  public accessToken!: string;
  @prop({ required: true })
  public refreshToken!: string;
  @prop({ required: true })
  public expiryTimestamp!: number;
}
export const APITokenModel = getModelForClass(APIToken)

export class TwitchTokens {
  @prop({ required: true })
  public accessToken?: string;
  @prop({ required: true })
  public refreshToken?: string;
  @prop({ required: true })
  public expiryTimestamp?: number;
}

export const TwitchTokensModel = getModelForClass(TwitchTokens)