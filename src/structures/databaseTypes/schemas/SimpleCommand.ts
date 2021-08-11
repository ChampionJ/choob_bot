import {
  getModelForClass,
  index,
  modelOptions,
  mongoose,
  prop,
  queryMethod,
  ReturnModelType,
} from "@typegoose/typegoose";
import { BaseTwitchCommand } from "../../commands/BaseCommand";
import {
  ChannelPermissionLevel,
  ITwitchChoobCommand,
  ITwitchCustomCommand,
  IDiscordChoobCommand,
  IDiscordCustomCommand,
} from "../interfaces/ICommand";

@modelOptions({ schemaOptions: { collection: "twitch_custom_commands" } })
export class TwitchCustomCommand implements ITwitchCustomCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true })
  name!: string;
  @prop({ required: true })
  channelId!: string;
  @prop({ required: true })
  channelName!: string;
  @prop({ required: true, default: false })
  colorResponse!: boolean;
  @prop({
    enum: ChannelPermissionLevel,
    type: String,
    required: true,
    default: ChannelPermissionLevel.GENERAL,
  })
  channelPermissionLevelRequired!: ChannelPermissionLevel;
  @prop({})
  alias?: mongoose.Types.ObjectId;
  @prop({})
  response?: string;
}
export const TwitchCustomCommandModel = getModelForClass(TwitchCustomCommand);

@modelOptions({ schemaOptions: { collection: "discord_custom_commands" } })
export class DiscordCustomCommand implements IDiscordCustomCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true })
  name!: string;
  @prop({ required: true })
  guildId!: string;
  @prop({ required: true, default: "#FFFFFF" })
  embedColor!: string;
  @prop({
    required: false,
  })
  guildPermissionLevelRequired?: bigint;
  @prop({ type: [String] })
  guildRoleIDRequired?: [string];
  @prop({})
  alias?: mongoose.Types.ObjectId;
  @prop({})
  response?: string;
}
export const DiscordCustomCommandModel = getModelForClass(DiscordCustomCommand);

@modelOptions({ schemaOptions: { collection: "twitch_choob_commands" } })
export class TwitchGlobalSimpleCommand implements ITwitchChoobCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  name!: string;
  @prop({ type: [String], default: [] })
  aliases!: string[];
  @prop({
    enum: ChannelPermissionLevel,
    type: String,
    required: true,
    default: ChannelPermissionLevel.GENERAL,
  })
  channelPermissionLevelRequired!: ChannelPermissionLevel;
  @prop({ required: true })
  response!: string;
  @prop({ default: false })
  colorResponse!: false;
}
export const TwitchGlobalSimpleCommandModel = getModelForClass(
  TwitchGlobalSimpleCommand
);

@modelOptions({ schemaOptions: { collection: "discord_choob_commands" } })
export class DiscordGlobalSimpleCommand implements IDiscordChoobCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  name!: string;
  @prop({ type: [String], default: [] })
  aliases!: string[];
  @prop({ required: true })
  response!: string;
  @prop({ required: true, default: "#FFFFFF" })
  embedColor!: string;
  @prop({
    required: false,
  })
  guildPermissionLevelRequired?: bigint;
}
export const DiscordGlobalSimpleCommandModel = getModelForClass(
  DiscordGlobalSimpleCommand
);
