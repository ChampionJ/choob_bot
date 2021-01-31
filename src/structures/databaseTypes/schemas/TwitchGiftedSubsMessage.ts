import { getDiscriminatorModelForClass, getModelForClass, modelOptions, mongoose, prop } from "@typegoose/typegoose";
import { ITwitchEventMessage, ITwitchEventMessageGiftedSubs, TwitchEventMessageTypes } from "../interfaces/ITwitchEventMessages"
@modelOptions({ schemaOptions: { discriminatorKey: 'eventType', collection: 'twitch_event_messages' } })
export class TwitchEventMessage implements ITwitchEventMessage {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true })
  eventType!: string
  @prop({ required: true })
  public message!: string;
}
export const TwitchEventMessageModel = getModelForClass(TwitchEventMessage)

export class TwitchEventMessageGiftedSubs extends TwitchEventMessage implements ITwitchEventMessageGiftedSubs {
  @prop({ required: true, default: 1 })
  public minimumGifts!: number;
}
export const TwitchEventMessageGiftedSubsModel = getDiscriminatorModelForClass(TwitchEventMessageModel, TwitchEventMessageGiftedSubs, TwitchEventMessageTypes.GIFTEDSUB)

