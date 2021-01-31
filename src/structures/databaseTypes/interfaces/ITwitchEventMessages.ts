import { mongoose } from "@typegoose/typegoose";

export enum TwitchEventMessageTypes {
  GIFTEDSUB = 'Gifted Subscription',
  SUB = 'New Subscription',
  RESUB = 'Resubscribed'
};

export interface ITwitchEventMessage {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  //* Required Properties
  eventType: string
  message: string;
}

export interface ITwitchEventMessageGiftedSubs extends ITwitchEventMessage {
  //* Required Properties
  minimumGifts: number;
}