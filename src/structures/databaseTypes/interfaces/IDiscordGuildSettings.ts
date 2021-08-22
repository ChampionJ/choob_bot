import { mongoose } from "@typegoose/typegoose";

export enum DiscordGuildSettingCategory {
  GUILD_CONFIG = "GUILD_CONFIG",
  EDITOR_PERMISSION_GROUPS = "EDITOR_PERMISSION_GROUPS",
  EDITORS = "EDITORS",
  COMMANDS = "COMMANDS",
  MISC = "MISC",
}

export enum DiscordGuildEditorPermissions {
  //* Guild Config
  CHANGE_PREFIX = "CHANGE_PREFIX",

  //* Editor Permission Groups
  VIEW_EDITOR_PERMISSION_GROUPS = "VIEW_EDITOR_PERMISSION_GROUPS",
  EDIT_EDITOR_PERMISSION_GROUPS = "EDIT_EDITOR_PERMISSION_GROUPS",
  ADD_EDITOR_PERMISSION_GROUPS = "ADD_EDITOR_PERMISSION_GROUPS",
  REMOVE_EDITOR_PERMISSION_GROUPS = "REMOVE_EDITOR_PERMISSION_GROUPS",

  //* Editors
  VIEW_EDITORS = "VIEW_EDITORS",
  SET_PERMISSION_GROUP_FOR_ANY_EDITOR = "SET_PERMISSION_GROUP_FOR_ANY_EDITOR",
  ADD_EDITORS = "ADD_EDITORS",
  REMOVE_EDITORS = "REMOVE_EDITORS",
  SET_PERMISSION_GROUP_OF_LOWER_RANKED_EDITORS = "SET_PERMISSION_GROUP_OF_LOWER_RANKED_EDITORS",

  //* Commands
  VIEW_COMMANDS = "VIEW_COMMANDS",
  EDIT_EXISTING_COMMANDS = "EDIT_EXISTING_COMMANDS",
  ADD_COMMANDS = "ADD_COMMANDS",
  REMOVE_COMMANDS = "REMOVE_COMMANDS",

  //* Event Messages
  TOGGLE_EVENT_MESSAGES = "TOGGLE_EVENT_MESSAGES",
}

export enum DiscordGuildSettingId {
  //* Event Messages
  EVENT_NEW_MEMBER = "dgs_event_new_guild_member_join",
  //* Global Command Settings
  COMMAND_REACTION_ROLE_CHECK = "dgs_command_reaction_role_check",
}

/**
 * This is the data that relates to each setting
 * There should only be one of these in the database per-setting
 * Only ADMINS should be able to modify this data
 *
 * Likely un-used in bot applications
 *
 * @export
 * @interface DiscordGuildSettingData
 */
export interface DiscordGuildSettingBaseData {
  //* Unique + Required Properties
  settingPropertyId: DiscordGuildSettingId; //this is the collection/schema

  //* Required Properties
  settingCategory: DiscordGuildSettingCategory;
  name: string;
  description: string;
}

export interface DiscordGuildSettingBase {
  //* Unique + Required Properties
  _id: mongoose.Types.ObjectId;
  guildId: string;

  //! Use guildId instead, this is for ease of debugging. Will be removed
  guildName?: string;
}

export interface GUILD_PERMISSION_GROUPS extends DiscordGuildSettingBase {
  //* Required Properties
  groups: DiscordGuildPermissionGroup[]; //Handling this as an array since we care about the order
}
export interface DiscordGuildPermissionGroup {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;

  //* Required Properties
  name: string;
  permissions: DiscordGuildEditorPermissions[];
}

export interface DiscordGuildEditors extends DiscordGuildSettingBase {
  //* Required Properties
  userId: string;
  permissionGroup: mongoose.Types.ObjectId;
}

export interface COMMAND_REACTION_ROLE_CHECK extends DiscordGuildSettingBase {
  //* Required Properties
  roleIdPermissions: string[];
}
