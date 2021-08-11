import { mongoose } from "@typegoose/typegoose";
import { ColorResolvable } from "discord.js";

export enum ChannelPermissionLevel {
  BROADCASTER = "Broadcaster",
  MODERATOR = "Moderator",
  VIP = "Vip",
  GENERAL = "General",
  CHOOB_CHANNEL = "Choob",
}

export interface ITwitchCustomCommand {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  //* Required Properties
  name: string;
  channelId: string;
  channelName: string;
  colorResponse: boolean;
  channelPermissionLevelRequired: ChannelPermissionLevel;
  //* Optional Properties
  alias?: mongoose.Types.ObjectId;
  response?: string;
}

export interface ITwitchChoobCommand {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  name: string;
  //* Required Properties
  aliases: string[];
  channelPermissionLevelRequired: ChannelPermissionLevel;
  response: string;
  colorResponse: false;
}

export interface IDiscordCustomCommand {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  //* Required Properties
  name: string;
  guildId: string;
  embedColor: string;
  //* Optional Properties
  guildPermissionLevelRequired?: bigint;
  guildRoleIDRequired?: [string];
  alias?: mongoose.Types.ObjectId;
  response?: string;
}

export interface IDiscordChoobCommand {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  name: string;
  //* Required Properties
  aliases: string[];
  response: string;
  embedColor: string;
  //* Optional Properties
  guildPermissionLevelRequired?: bigint;
}
