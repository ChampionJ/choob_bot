import {
  defaultClasses,
  plugin,
  getDiscriminatorModelForClass,
  getModelForClass,
  modelOptions,
  mongoose,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import {
  COMMAND_REACTION_ROLE_CHECK,
  DiscordGuildSettingBase,
  DiscordGuildSettingId,
} from "../interfaces/IDiscordGuildSettings";

@modelOptions({ schemaOptions: { collection: "discord_guild_settings" } })
export class DiscordGuildSetting implements DiscordGuildSettingBase {
  _id!: mongoose.Types.ObjectId;
  @prop({ required: true, unique: true })
  public guildId!: string;
  @prop({})
  public guildName?: string;
}

@modelOptions({
  schemaOptions: {
    collection: DiscordGuildSettingId.COMMAND_REACTION_ROLE_CHECK,
  },
})
export class DGSCommandReactionRoleCheck
  extends DiscordGuildSetting
  implements COMMAND_REACTION_ROLE_CHECK
{
  @prop({ required: true, default: [], type: [String] })
  roleIdPermissions!: string[];
}
export const DGSCommandReactionRoleCheckModel = getModelForClass(
  DGSCommandReactionRoleCheck
);
