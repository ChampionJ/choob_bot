import { defaultClasses, plugin, getDiscriminatorModelForClass, getModelForClass, modelOptions, mongoose, prop, ReturnModelType } from "@typegoose/typegoose";
import { EVENT_GIFT_SUB_LISTENING, TwitchChannelSettingBase, TwitchChannelSettingId } from "../interfaces/TwitchChannelSettings.types";

// TODO make settings all inherit this base, *unique* identifier = channel id, discrim = setting enum
@modelOptions({ schemaOptions: { collection: 'twitch_channel_settings' } })
export class TwitchChannelSetting implements TwitchChannelSettingBase {
  @prop({ required: true, unique: true })
  public channelId!: string;
}
const TwitchChannelSettingSchema = getModelForClass(TwitchChannelSetting);

@modelOptions({ schemaOptions: { collection: 'tcs_event_gift_sub_listening' } })
export class TCSEventGiftSubListening extends TwitchChannelSetting implements EVENT_GIFT_SUB_LISTENING {
  @prop({ required: true, default: true })
  isListening!: boolean;
}
export const TCSEventGiftSubListeningModel = getModelForClass(TCSEventGiftSubListening);

