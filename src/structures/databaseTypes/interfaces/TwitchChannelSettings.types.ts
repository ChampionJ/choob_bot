import { getDiscriminatorModelForClass } from "@typegoose/typegoose";

export enum TwitchChannelSettingId {
  //* Event Messages
  EVENT_GIFT_SUB_OPTIONS = 'twitch_channel_setting_EVENT_GIFT_SUB_OPTIONS',
  EVENT_GIFT_SUB_LISTENING = 'twitch_channel_setting_EVENT_GIFT_SUB_LISTENING',

  EVENT_COMMUNITY_SUB_LISTENING = 'twitch_channel_setting_EVENT_COMMUNITY_SUB_LISTENING',
  EVENT_COMMUNITY_SUB_OPTIONS = 'twitch_channel_setting_EVENT_COMMUNITY_SUB_OPTIONS',

  EVENT_ANONYMOUS_GIFT_SUB_LISTENING = 'twitch_channel_setting_EVENT_ANONYMOUS_GIFT_SUB_LISTENING',
  EVENT_ANONYMOUS_GIFT_SUB_OPTIONS = 'twitch_channel_setting_EVENT_ANONYMOUS_GIFT_SUB_OPTIONS',

  EVENT_ANONYMOUS_GIFT_SUBS_LISTENING = 'twitch_channel_setting_EVENT_ANONYMOUS_GIFT_SUBS_LISTENING',
  EVENT_ANONYMOUS_GIFT_SUBS_OPTIONS = 'twitch_channel_setting_EVENT_ANONYMOUS_GIFT_SUBS_OPTIONS',

  EVENT_JOIN_LISTENING = 'twitch_channel_setting_EVENT_JOIN_LISTENING',
  EVENT_JOIN_OPTIONS = 'twitch_channel_setting_EVENT_JOIN_OPTIONS',

  EVENT_NEW_FOLLOWER_LISTENING = 'twitch_channel_setting_EVENT_NEW_FOLLOWER_LISTENING',
  EVENT_NEW_FOLLOWER_OPTIONS = 'twitch_channel_setting_EVENT_NEW_FOLLOWER_OPTIONS',

  EVENT_RESUB_LISTENING = 'twitch_channel_setting_EVENT_RESUB_LISTENING',
  EVENT_RESUB_OPTIONS = 'twitch_channel_setting_EVENT_RESUB_OPTIONS',

  EVENT_COMMUNITY_PAY_FORWARD_LISTENING = 'twitch_channel_setting_EVENT_COMMUNITY_PAY_FORWARD_LISTENING',
  EVENT_COMMUNITY_PAY_FORWARD_OPTIONS = 'twitch_channel_setting_EVENT_COMMUNITY_PAY_FORWARD_OPTIONS',

  EVENT_GIFT_PAID_UPGRADE_LISTENING = 'twitch_channel_setting_EVENT_GIFT_PAID_UPGRADE_LISTENING',
  EVENT_GIFT_PAID_UPGRADE_OPTIONS = 'twitch_channel_setting_EVENT_GIFT_PAID_UPGRADE_OPTIONS',

  EVENT_PRIME_PAID_UPGRADE_LISTENING = 'twitch_channel_setting_EVENT_PRIME_PAID_UPGRADE_LISTENING',
  EVENT_PRIME_PAID_UPGRADE_OPTIONS = 'twitch_channel_setting_EVENT_PRIME_PAID_UPGRADE_OPTIONS',

  EVENT_STANDARD_PAY_FORWARD_LISTENING = 'twitch_channel_setting_EVENT_STANDARD_PAY_FORWARD_LISTENING',
  EVENT_STANDARD_PAY_FORWARD_OPTIONS = 'twitch_channel_setting_EVENT_STANDARD_PAY_FORWARD_OPTIONS',

  EVENT_BITS_LISTENING = 'twitch_channel_setting_EVENT_BITS_LISTENING',
  EVENT_BITS_OPTIONS = 'twitch_channel_setting_EVENT_BITS_OPTIONS',

  EVENT_RAID_LISTENING = 'twitch_channel_setting_EVENT_RAID_LISTENING',
  EVENT_RAID_OPTIONS = 'twitch_channel_setting_EVENT_RAID_OPTIONS',

  EVENT_HOST_LISTENING = 'twitch_channel_setting_EVENT_HOST_LISTENING',
  EVENT_HOST_OPTIONS = 'twitch_channel_setting_EVENT_HOST_OPTIONS',
  //* 


};

export enum TwitchChannelSettingCategory {
  ADMIN = 'ADMIN',
  CHOOB = 'CHOOB',
  PERMISSIONS = 'PERMISSIONS',
  GLOBAL = 'GLOBAL',
  COMMANDS = 'COMMANDS',
  EVENT_MESSAGES = 'EVENT_MESSAGES',
  MISC = 'MISC'
};

/**
 * This is the data that relates to each setting
 * There should only be one of these in the database per-setting
 * Only ADMINS should be able to modify this data
 * 
 * Likely un-used in bot applications
 * 
 * @export
 * @interface TwitchChannelSettingData
 */
export interface TwitchChannelSettingBaseData {
  //* Unique + Required Properties
  settingPropertyId: TwitchChannelSettingId;

  //* Required Properties
  settingCategory: TwitchChannelSettingCategory;
  permissionCategoryGroup: string;
  name: string;
  description: string;
}

export interface TwitchChannelSettingBase {
  //* Unique + Required Properties
  channelId: string;
}


export interface EVENT_GIFT_SUB_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_GIFT_SUB_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_COMMUNITY_SUB_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_COMMUNITY_SUB_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_ANONYMOUS_GIFT_SUB_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_ANONYMOUS_GIFT_SUB_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_ANONYMOUS_GIFT_SUBS_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_ANONYMOUS_GIFT_SUBS_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_JOIN_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_JOIN_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_NEW_FOLLOWER_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_NEW_FOLLOWER_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_RESUB_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_RESUB_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_COMMUNITY_PAY_FORWARD_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_COMMUNITY_PAY_FORWARD_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_GIFT_PAID_UPGRADE_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_GIFT_PAID_UPGRADE_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_PRIME_PAID_UPGRADE_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_PRIME_PAID_UPGRADE_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_STANDARD_PAY_FORWARD_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_STANDARD_PAY_FORWARD_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_BITS_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_BITS_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_RAID_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_RAID_OPTIONS extends TwitchChannelSettingBase { }
export interface EVENT_HOST_LISTENING extends TwitchChannelSettingBase { }
export interface EVENT_HOST_OPTIONS extends TwitchChannelSettingBase { }
