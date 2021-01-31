import { mongoose } from "@typegoose/typegoose";

export interface ITwitchChannelConfig {
  //* Unique and Required Properties
  _id?: mongoose.Types.ObjectId;
  identifier: string;

  //* Required Properties
  channelName: string;
  botIsInChannel: boolean;
  prefix: string;
  colorAllMessages: boolean;

}