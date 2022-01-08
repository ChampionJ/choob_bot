import { mongoose } from "@typegoose/typegoose";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import {
  DiscordCustomCommand,
  DiscordGlobalSimpleCommand,
  TwitchCustomCommand,
  TwitchGlobalSimpleCommand,
} from "../databaseTypes/schemas/SimpleCommand";
import { TwitchChannelConfigModel } from "../databaseTypes/schemas/TwitchChannelConfig";
import StateManager from "../../utils/StateManager";
import { TwitchManager } from "../../twitch/TwitchClientManager";
import { BaseDiscordCommand, BaseTwitchCommand } from "./BaseCommand";
import { ChoobLogger } from "../../utils/ChoobLogger";
import { DiscordManager } from "../../discord/DiscordClientManager";
import {
  ApplicationCommandData,
  ApplicationCommandPermissionData,
  ColorResolvable,
  CommandInteraction,
  GuildApplicationCommandPermissionData,
  Interaction,
  Message,
  MessageEmbed,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { DGSCommandReactionRoleCheckModel } from "../databaseTypes/schemas/DiscordGuildSettings";

export class TwitchGlobalChoobCommand extends BaseTwitchCommand {
  responseString: string;

  constructor(private _data: TwitchGlobalSimpleCommand) {
    super(_data.name!, _data.channelPermissionLevelRequired, undefined, []);
    this.responseString = ParseForStaticVars(_data.response!);
  }
  get data(): TwitchGlobalSimpleCommand {
    return this._data;
  }

  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ) {
    const replyMessage: string = await ParseForTwitchVars(
      this.responseString,
      message,
      message.target.value,
      args
    );
    client.sendMsg(message.channelId!, message.target.value, replyMessage);
    ChoobLogger.verbose(
      `${message.userInfo.userName} executed ${this._data.name} command in ${message.target.value}`
    );
  }
}
export class TwitchBaseSimpleCommand extends BaseTwitchCommand {
  responseString: string;

  constructor(private _data: TwitchCustomCommand) {
    super(_data.name!, _data.channelPermissionLevelRequired, undefined, []);
    this.responseString = ParseForStaticVars(_data.response!);
  }
  get data(): TwitchCustomCommand {
    return this._data;
  }

  async run(
    client: TwitchManager,
    targetChannel: string,
    message: TwitchPrivateMessage,
    args: Array<string>
  ) {
    const replyMessage: string = await ParseForTwitchVars(
      this.responseString,
      message,
      message.target.value,
      args
    );
    if (this.data.colorResponse) {
      client.action(message.target.value, replyMessage);
    } else {
      client.sendMsg(message.channelId!, message.target.value, replyMessage);
    }
    ChoobLogger.verbose(
      `${message.userInfo.userName} executed ${this._data.name} command in ${message.target.value}`
    );
  }
}

export class DiscordGlobalChoobCommand extends BaseDiscordCommand {
  responseString: string;

  constructor(private _data: DiscordGlobalSimpleCommand) {
    super(
      _data.name!,
      undefined,
      _data.guildPermissionLevelRequired,
      undefined,
      []
    );
    this.responseString = ParseForStaticVars(_data.response!);
  }
  get data(): DiscordGlobalSimpleCommand {
    return this._data;
  }
  getSlashCommand() {
    return new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(" ");
  }
  getApplicationCommand(): ApplicationCommandData {
    return { description: " ", name: this.getName() };
  }
  async getSlashCommandPermissionsForGuild(
    commandId: string,
    guildId: string
  ): Promise<GuildApplicationCommandPermissionData | undefined> {
    return undefined;
  }

  async run(client: DiscordManager, message: Message, args: Array<string>) {
    const replyMessage: string = await ParseForDiscordVars(
      this.responseString,
      message,
      args
    );
    const embed = new MessageEmbed()
      .setColor(this.data.embedColor as ColorResolvable)
      .setDescription(replyMessage);
    message.channel.send({ embeds: [embed] });

    ChoobLogger.verbose(
      `${message.author.username} executed ${this._data.name} command in ${message.guild}`
    );
  }
  async runInteraction(
    client: DiscordManager,
    interaction: CommandInteraction
  ) {
    await interaction.reply({
      content: this.responseString,
      ephemeral: true,
    });
  }
}

export class DiscordBaseSimpleCommand extends BaseDiscordCommand {
  responseString: string;

  constructor(private _data: DiscordCustomCommand) {
    super(
      _data.name!,
      undefined,
      _data.guildPermissionLevelRequired,
      _data.guildRoleIDRequired,
      []
    );
    this.responseString = ParseForStaticVars(_data.response!);
  }
  get data(): DiscordCustomCommand {
    return this._data;
  }

  getSlashCommand() {
    return new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(" ");
  }
  getApplicationCommand(): ApplicationCommandData {
    return { description: " ", name: this.getName() };
  }
  async getSlashCommandPermissionsForGuild(
    commandId: string,
    guildId: string
  ): Promise<GuildApplicationCommandPermissionData | undefined> {
    if (this.data.guildRoleIDRequired) {
      let perms = await this.getSlashCommandPermissionsForRoles(
        this.data.guildRoleIDRequired,
        true
      );
      return { id: commandId, permissions: [...perms] };
    }

    return undefined;
  }

  async runInteraction(
    client: DiscordManager,
    interaction: CommandInteraction
  ) {
    await interaction.reply({
      content: this.responseString,
      ephemeral: true,
    });
  }

  async run(client: DiscordManager, message: Message, args: Array<string>) {
    const replyMessage: string = await ParseForDiscordVars(
      this.responseString,
      message,
      args
    );

    const embed = new MessageEmbed()
      .setColor(this.data.embedColor as ColorResolvable)
      .setDescription(replyMessage);
    message.channel.send({ embeds: [embed] });

    ChoobLogger.verbose(
      `${message.author.username} executed ${this._data.name} command in ${message.guild}`
    );
  }
}

function ParseForStaticVars(inputString: string): string {
  let outString = inputString;
  //todo can't use this npm_package_version thing I guess
  outString = outString.replace(
    "{choobbotversion}",
    process.env.npm_package_version!
  );
  return outString;
}
async function ParseForDiscordVars(
  responseString: string,
  incomingMessage: Message,
  args: string[]
): Promise<string> {
  let outString = responseString;
  if (outString.match(/{.*}/g) === null) {
    // no maches
    return outString;
  }

  outString = await ParseForGenericVars(outString, args);
  return outString;
}

async function ParseForGenericVars(
  toParse: string,
  args: string[]
): Promise<string> {
  let outString = toParse;
  outString = outString.replace(
    /\{choobquotescount\}/g,
    StateManager.choobs.length.toString()
  );

  for (let i = 0; i < 5; i++) {
    if (outString.includes(`{arg${i + 1}`)) {
      if (args.length > i) {
        const regex = new RegExp(`\{arg${i + 1}\}`, "g");
        outString = outString.replace(regex, args[i] ?? " ");
      } else {
        outString = "Invalid number of arguments...";
      }
    }
  }

  return outString;
}

async function ParseForTwitchVars(
  responseString: string,
  rawMsgData: TwitchPrivateMessage,
  targetChannel: string,
  args: string[]
): Promise<string> {
  let outString = responseString;
  if (outString.match(/{.*}/g) === null) {
    // no maches
    return outString;
  }
  //TODO should track what placeholders are in a command when it's added to the database so we don't need to search every time
  outString = outString.replace(/\{username\}/g, rawMsgData.userInfo.userName);
  outString = outString.replace(
    /\{displayname\}/g,
    rawMsgData.userInfo.displayName
  );
  outString = outString.replace(/\{channel\}/g, targetChannel.slice(1));

  if (outString.includes("{choobchannelscount}")) {
    let choobChannelsCount = await TwitchChannelConfigModel.countDocuments({
      botIsInChannel: true,
    });
    outString = outString.replace(
      /\{choobchannelscount\}/g,
      choobChannelsCount.toString()
    );
  }
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("@")) {
      args[i] = args[i].slice(1);
    }
  }
  outString = await ParseForGenericVars(outString, args);
  return outString;
}
