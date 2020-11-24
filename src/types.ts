import { Collection } from "discord.js";
import { Options, Userstate, client, Events, Actions, Client, ClientBase } from "tmi.js";
import BaseCommand from "./utils/structures/BaseCommand";
import BaseEvent from "./utils/structures/BaseEvent";
import { StrictEventEmitter } from "tmi.js/strict-event-emitter-types";




export class TwitchManager {
  client: Client;
  private _commands = new Collection<string, BaseCommand>();
  private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get events(): Collection<string, BaseEvent> { return this._events; }
  get prefix(): string { return this._prefix; }

  set prefix(prefix: string) { this._prefix = prefix; }

  constructor(opts: Options) {
    this.client = client(opts);
  }
}
export interface TwitchMessage {
  target: string,
  user: Userstate,
  msg: string,
  self: boolean
}
export interface ChoobBotLocalSettings {
  connectionSettings: Options;
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
