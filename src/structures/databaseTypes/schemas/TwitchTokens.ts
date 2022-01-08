import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
} from "@typegoose/typegoose";

import { ITwitchToken, IAPIToken } from "../interfaces/IAPIToken";

@modelOptions({ schemaOptions: { collection: "api_tokens" } })
export class APIToken implements IAPIToken {
  _id!: mongoose.Types.ObjectId;
  @prop({ type: String, required: true, unique: true })
  identifier!: string;
  @prop({ required: true })
  public accessToken!: string;
  @prop({ required: true })
  public refreshToken!: string;
  @prop({ required: true })
  public expiryTimestamp!: number;
  @prop({ required: true })
  public expiresIn!: number;
  @prop({ required: true })
  public obtainmentTimestamp!: number;
}
export const APITokenModel = getModelForClass(APIToken);

export class TwitchTokens implements ITwitchToken {
  @prop({ required: true })
  public accessToken!: string;
  @prop({ required: true })
  public refreshToken!: string;
  @prop({ required: true })
  public expiryTimestamp!: number;
}

export const TwitchTokensModel = getModelForClass(TwitchTokens);
