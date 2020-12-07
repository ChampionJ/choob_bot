import { Collection } from "discord.js";
import BaseCommand from "./utils/structures/BaseCommand";
import { ChatClient } from "twitch-chat-client";
import { AuthProvider } from "twitch-auth";
import { ChatClientOptions } from "twitch-chat-client/lib/ChatClient";
import { EventHandlerList } from "ircv3/lib/IrcClient"


export function stringSimilarity(s1: string, s2: string) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}
function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export class TwitchManager extends ChatClient {
  [index: string]: any;

  private _commands = new Collection<string, BaseCommand>();
  //private _events = new Collection<string, BaseEvent>();
  private _prefix: string = '!';

  constructor(authProvider: AuthProvider | undefined, options?: ChatClientOptions | undefined) {
    super(authProvider, options);
  }

  get commands(): Collection<string, BaseCommand> { return this._commands; }
  get events(): Map<string, EventHandlerList> { return this._events; }
  get prefix(): string { return this._prefix; }
  set prefix(prefix: string) { this._prefix = prefix; }
}


export class TwitchMessage {
  manager: TwitchManager;
  target: string;
  user: any;
  msg: string;
  self: boolean;
  constructor(manager: TwitchManager, target: string, user: any, msg: string, self: boolean) {
    this.manager = manager;
    this.target = target;
    this.user = user;
    this.msg = msg;
    this.self = self;
  }
  replyInChat(msg: string) {
    this.manager.say(this.target, msg);

  }
  replyInWhisper(msg: string) {
    this.manager.whisper(this.user.username, msg)
  }
}
export interface ChoobBotLocalSettings {
  connectionSettings: any;
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
