import { getModelForClass, index, modelOptions, mongoose, prop, queryMethod, ReturnModelType } from "@typegoose/typegoose";
import BaseCommand from "../../commands/BaseCommand";
import { ChannelPermissionLevel, ITwitchChoobCommand, ITwitchCustomCommand } from "../interfaces/ICommand";


@modelOptions({ schemaOptions: { collection: 'twitch_custom_commands' } })
export class TwitchCustomCommand implements ITwitchCustomCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true })
  name!: string
  @prop({ required: true })
  channelId!: string
  @prop({ required: true })
  channelName!: string
  @prop({ required: true, default: false })
  colorResponse!: boolean;
  @prop({ enum: ChannelPermissionLevel, type: String, required: true, default: ChannelPermissionLevel.GENERAL })
  channelPermissionLevelRequired!: ChannelPermissionLevel;
  @prop({})
  alias?: mongoose.Types.ObjectId;
  @prop({})
  response?: string;
}
export const TwitchCustomCommandModel = getModelForClass(TwitchCustomCommand)



@modelOptions({ schemaOptions: { collection: 'twitch_choob_commands' } })
export class TwitchGlobalSimpleCommand implements ITwitchChoobCommand {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  name!: string
  @prop({ type: [String], default: [] })
  aliases!: string[];
  @prop({ enum: ChannelPermissionLevel, type: String, required: true, default: ChannelPermissionLevel.GENERAL })
  channelPermissionLevelRequired!: ChannelPermissionLevel;
  @prop({ required: true })
  response!: string;
  @prop({ default: false })
  colorResponse!: false;

}
export const TwitchGlobalSimpleCommandModel = getModelForClass(TwitchGlobalSimpleCommand)