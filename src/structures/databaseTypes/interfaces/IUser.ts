import { mongoose } from "@typegoose/typegoose";

//* These are roles for choob bot globally, discord and twitch alike
export enum ChoobRole {
  ADMIN = "ADMIN",
  ADDCHOOB = "Quote Creation",
  REMOVECHOOB = "Quote Removal",
}
export enum AuthType {
  TwitchUser = "Twitch",
  DiscordUser = "Discord",
}

export interface IUser {
  //* Required and Unique Properties
  _id: mongoose.Types.ObjectId;
  //* Required Properties
  authType: AuthType;
  identifier: string;
  roles: ChoobRole[];
  //* Optional Properties
  accessToken?: string;
  refreshToken?: string;
}

export interface ITwitchUser extends IUser {
  //* Required and Unique Properties
  identifier: string;
  //* Required Properties
  username: string;
  displayName: string;
}
export interface IDiscordUser extends IUser {
  identifier: string;
  username: string;
  discriminator: string;
  avatar?: string;
  guilds?: GuildInfo[];
}
export interface GuildInfo {
  owner: boolean;
  permissions: number;
  icon: string;
  id: string;
  name: string;
}
