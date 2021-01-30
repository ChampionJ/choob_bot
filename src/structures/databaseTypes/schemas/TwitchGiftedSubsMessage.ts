import { getDiscriminatorModelForClass, getModelForClass, modelOptions, mongoose, prop } from "@typegoose/typegoose";
export enum TwitchEventMessageTypes {
  GIFTEDSUB = 'Gifted Subscription',
  SUB = 'New Subscription',
  RESUB = 'Resubscribed'
};
@modelOptions({ schemaOptions: { discriminatorKey: 'eventType', collection: 'twitch_event_messages' } })
export class TwitchEventMessage {
  _id?: mongoose.Types.ObjectId;
  @prop({ required: true })
  eventType!: string
  @prop({ required: true })
  public message!: string;
}
export const TwitchEventMessageModel = getModelForClass(TwitchEventMessage)

export class TwitchEventMessageGiftedSubs extends TwitchEventMessage {
  @prop({ required: true, default: 1 })
  public minimumGifts!: number;
}
export const TwitchEventMessageGiftedSubsModel = getDiscriminatorModelForClass(TwitchEventMessageModel, TwitchEventMessageGiftedSubs, TwitchEventMessageTypes.GIFTEDSUB)

