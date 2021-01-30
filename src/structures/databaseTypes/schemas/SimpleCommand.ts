import { getModelForClass, index, modelOptions, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import BaseCommand from "../../commands/BaseCommand";

export enum ChannelPermissionLevel {
  BROADCASTER = 'Broadcaster',
  MODERATOR = 'Moderator',
  VIP = 'Vip',
  GENERAL = 'General',
  CHOOB_CHANNEL = 'Choob'
}

@modelOptions({ schemaOptions: { collection: 'twitch_custom_commands' } })
export class TwitchCustomCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true })
  name!: string
  @prop({ required: true })
  channelId!: string
  @prop({ required: true })
  channelName!: string
  @prop({})
  alias?: mongoose.Types.ObjectId;
  @prop({})
  response?: string;
  @prop({ default: false })
  colorResponse?: false;
  @prop({ enum: ChannelPermissionLevel, type: String, required: true, default: ChannelPermissionLevel.GENERAL })
  channelPermissionLevelRequired!: ChannelPermissionLevel;
}
export const TwitchCustomCommandModel = getModelForClass(TwitchCustomCommand)



@modelOptions({ schemaOptions: { collection: 'twitch_choob_commands' } })
export class TwitchGlobalSimpleCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  name!: string
  @prop({ type: [String], default: [] })
  aliases!: string[];
  @prop({ enum: ChannelPermissionLevel, type: String, default: ChannelPermissionLevel.GENERAL })
  permissionLevelRequired?: ChannelPermissionLevel;
  @prop({ enum: ChannelPermissionLevel, type: String, required: true, default: ChannelPermissionLevel.GENERAL })
  channelPermissionLevelRequired!: ChannelPermissionLevel;
  @prop({ required: true })
  response!: string;
  @prop({ default: false })
  colorResponse!: false;

}
export const TwitchGlobalSimpleCommandModel = getModelForClass(TwitchGlobalSimpleCommand)