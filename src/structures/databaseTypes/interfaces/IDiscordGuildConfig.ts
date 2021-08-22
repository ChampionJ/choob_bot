import { mongoose } from "@typegoose/typegoose";

export interface IDiscordGuildConfig {
  //* Unique and Required Properties
  _id?: mongoose.Types.ObjectId;
  guildId: string;

  //* Required Properties
  guildName: string;
  botIsInGuild: boolean;
  prefix: string;
}
