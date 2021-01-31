import { defaultClasses, plugin, getDiscriminatorModelForClass, getModelForClass, modelOptions, mongoose, prop, ReturnModelType } from "@typegoose/typegoose";
import { EVENT_GIFT_SUB_LISTENING, EVENT_GIFT_SUB_OPTIONS, EVENT_RESUB_LISTENING, TwitchChannelSettingBase, TwitchChannelSettingId } from "../interfaces/ITwitchChannelSettings";

@modelOptions({ schemaOptions: { collection: 'twitch_channel_settings' } })
export class TwitchChannelSetting implements TwitchChannelSettingBase {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public channelId!: string;
  @prop({})
  public channelName?: string;
}
//const TwitchChannelSettingSchema = getModelForClass(TwitchChannelSetting);

@modelOptions({ schemaOptions: { collection: TwitchChannelSettingId.EVENT_GIFT_SUB_LISTENING } })
export class TCSEventGiftSubListening extends TwitchChannelSetting implements EVENT_GIFT_SUB_LISTENING {
  @prop({ required: true, default: true })
  isListening!: boolean;
}
export const TCSEventGiftSubListeningModel = getModelForClass(TCSEventGiftSubListening);

@modelOptions({
  schemaOptions: {
    collection: TwitchChannelSettingId.EVENT_GIFT_SUB_OPTIONS
  }
})
export class TCSEventGiftSubOptions extends TwitchChannelSetting implements EVENT_GIFT_SUB_OPTIONS {
  @prop({ required: true, default: 1 })
  minimumNumOfSubs!: number;
}
export const TCSEventGiftSubOptionsModel = getModelForClass(TCSEventGiftSubOptions);


@modelOptions({ schemaOptions: { collection: TwitchChannelSettingId.EVENT_RESUB_LISTENING } })
export class TCSEventResubListening extends TwitchChannelSetting implements EVENT_RESUB_LISTENING {
  @prop({ required: true, default: false })
  isListening!: boolean;
}
export const TCSEventResubListeningModel = getModelForClass(TCSEventResubListening)
