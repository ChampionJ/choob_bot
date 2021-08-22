import {
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
} from "@typegoose/typegoose";
import { IDiscordGuildConfig } from "../interfaces/IDiscordGuildConfig";

@modelOptions({ schemaOptions: { collection: "discord_guild_configs" } })
export class DiscordGuildConfig implements IDiscordGuildConfig {
  //? Identity

  _id?: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public guildId!: string;
  @prop({ required: true })
  public guildName!: string;

  //? Core Info
  @prop({ required: true, default: true })
  public botIsInGuild!: boolean;

  //? Global Settings
  @prop({ required: true, default: "!" })
  public prefix!: string;
}
export const DiscordGuildConfigModel = getModelForClass(DiscordGuildConfig);
