import { defaultClasses, plugin, getDiscriminatorModelForClass, getModelForClass, modelOptions, mongoose, prop, ReturnModelType } from "@typegoose/typegoose";
import { EVENT_GIFT_SUB_LISTENING, EVENT_GIFT_SUB_OPTIONS, EVENT_RESUB_LISTENING, TwitchChannelSettingBase, TwitchChannelSettingId } from "../interfaces/TwitchChannelSettings.types";

// TODO make settings all inherit this base, *unique* identifier = channel id, discrim = setting enum
@modelOptions({ schemaOptions: { collection: 'twitch_channel_settings' } })
export class TwitchChannelSetting implements TwitchChannelSettingBase {
  @prop({ required: true, unique: true })
  public channelId!: string;
}
//const TwitchChannelSettingSchema = getModelForClass(TwitchChannelSetting);

@modelOptions({ schemaOptions: { collection: 'tcs_event_gift_sub_listening' } })
export class TCSEventGiftSubListening extends TwitchChannelSetting implements EVENT_GIFT_SUB_LISTENING {
  @prop({ required: true, default: true })
  isListening!: boolean;
}
export const TCSEventGiftSubListeningModel = getModelForClass(TCSEventGiftSubListening);

@modelOptions({ schemaOptions: { collection: 'tcs_event_gift_sub_options' } })
export class TCSEventGiftSubOptions extends TwitchChannelSetting implements EVENT_GIFT_SUB_OPTIONS {
  @prop({ required: true, default: 1 })
  minimumNumOfSubs!: number;
}
export const TCSEventGiftSubOptionsModel = getModelForClass(TCSEventGiftSubOptions);


@modelOptions({ schemaOptions: { collection: 'tcs_event_resub_listening' } })
export class TCSEventResubListening extends TwitchChannelSetting implements EVENT_RESUB_LISTENING {
  @prop({ required: true, default: false })
  isListening!: false;
}
export const TCSEventResubListeningModel = getModelForClass(TCSEventResubListening)
