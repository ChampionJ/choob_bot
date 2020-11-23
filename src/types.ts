import { Client } from "tmi.js"

export type TwitchClient = Client;
export interface ChoobBotLocalSettings {
  connectionSettings: ConnectionSettings;
  discordToken: string;
  consoleLog: boolean;
  extraInfoChannels: string[];
  giftedsubs: string[];
  choob: Choob;
}

export interface Choob {
  ignoredTwitchChannels: any[];
  messages: string[];
}

export interface ConnectionSettings {
  options: Options;
  connection: Connection;
  identity: Identity;
  channels: string[];
}

export interface Connection {
  reconnect: boolean;
}

export interface Identity {
  username: string;
  password: string;
}

export interface Options {
  debug: boolean;
}

//////////

export interface ChoobBotSettings {
  superAdmins: string[];
  permissionLackingMessage: string;
  adminChannels: string[];
  aliases: Aliases;
  commands: Commands;
}

export interface Aliases {
  [index: string]: any
  chooborigin: string;
}

export interface Commands {
  [index: string]: any
  removechoobfromchannel: Removechoobfromchannel;
  addchoobtochannel: Addchoobtochannel;
  joinchoob: Joinchoob;
  leavechoob: Leavechoob;
  updatechoob: Updatechoob;
  togglechoob: Togglechoob;
  choobcount: ChoobchannelsClass;
  choobversion: ChoobchannelsClass;
  choobchannels: ChoobchannelsClass;
  addchoob: Add;
  removechoob: Remove;
  addgiftquote: Add;
  removegiftquote: Remove;
  choobinfo: ChoobchannelsClass;
  choobhelp: ChoobchannelsClass;
  choob: ChoobClass;
}

export interface Add {
  requiresAdmin: boolean;
  message: string;
  duplicateMsg: string;
}

export interface Addchoobtochannel {
  requiresSuperAdmin: boolean;
  joinMessage: string;
  doesntExist: string;
  existsMessage: string;
}

export interface ChoobClass {
}

export interface ChoobchannelsClass {
  message: string;
}

export interface Joinchoob {
  choobbotChannelOnly: boolean;
  joinMessage: string;
  existsMessage: string;
}

export interface Leavechoob {
  choobbotChannelOnly: boolean;
  leaveMessage: string;
  errorMessage: string;
}

export interface Remove {
  requiresAdmin: boolean;
  message: string;
  messageNoMatch: string;
}

export interface Removechoobfromchannel {
  requiresSuperAdmin: boolean;
  leaveMessage: string;
  errorExist: string;
}

export interface Togglechoob {
  requiresMod: boolean;
  onMessage: string;
  offMessage: string;
}

export interface Updatechoob {
  requiresSuperAdmin: boolean;
  successMessage: string;
  failMessage: string;
}
