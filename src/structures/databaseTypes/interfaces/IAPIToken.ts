import { mongoose } from "@typegoose/typegoose";

export interface ITwitchToken {
  //* Required
  accessToken: string;
  refreshToken: string;
  expiryTimestamp: number;
}

export interface IAPIToken {
  //* Required and Unique
  _id: mongoose.Types.ObjectId;
  identifier: string;
  //* Required
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainmentTimestamp: number;
  expiryTimestamp: number;
}
