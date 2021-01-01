require('dotenv').config()
import { Client, Message, User } from "discord.js";
import { registerCommands, registerEvents } from "./utils/registry";
import StateManager from './utils/StateManager';
import { AccessToken, RefreshableAuthProvider, StaticAuthProvider, TokenInfo } from 'twitch-auth';
import { TwitchTokensModel } from "./database/schemas/TwitchTokens";
import { TwitchChannelConfigModel } from "./database/schemas/TwitchChannelConfig";
import { TwitchManager } from "./utils/TwitchClientManager";
import { ChoobLogger } from "./utils/Logging";
import BaseSimpleCommand from "./utils/structures/BaseSimpleCommand";
import { CustomCommandModel } from "./database/schemas/SimpleCommand";

const util = require("util");
const Discord = require('discord.js');
let discordClient: Client;
let twitchManager: TwitchManager;

async function main() {
  setupDiscord()
  setupTwitch()
}
main();

async function setupDiscord() {
  discordClient = new Discord.Client({
    partials: ['MESSAGE', 'REACTION']
  });

  discordClient.login(process.env.DISCORD_TOKEN);

  discordClient.on('ready', () => {
    ChoobLogger.info('Connected to Discord as ' + discordClient.user?.tag + ' - (' + discordClient.user?.id + ')');
  });
  discordClient.on('message', (msg: Message) => {
    ChoobLogger.info(`Message: \n${msg}`)
    if (msg.content === '!choobbot') {
      const embed = new Discord.MessageEmbed().setTitle('A slick little embed').setColor(0xff0000).setDescription('This is a description');
      msg.channel.send(embed)
    }
  });
}

async function setupTwitch() {
  const clientId = process.env.TWITCH_CLIENTID!;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!;
  let tokenData: any;
  tokenData = await TwitchTokensModel.findOne({});

  const auth = new RefreshableAuthProvider(
    new StaticAuthProvider(clientId, tokenData.accessToken),
    {
      clientSecret,
      refreshToken: tokenData.refreshToken,
      expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
      onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
        const newTokenData = {
          accessToken,
          refreshToken,
          expiryTimestamp: expiryDate === null ? undefined : expiryDate.getTime()
        };
        await TwitchTokensModel.replaceOne({}, { accessToken: newTokenData.accessToken, refreshToken: newTokenData.refreshToken, expiryTimestamp: newTokenData.expiryTimestamp })
      }
    }
  );

  let channels: string[] = [];
  await TwitchChannelConfigModel.find({ botIsInChannel: true }).then((configs) => {
    if (configs != null) {
      configs.forEach(config => {
        channels.push(config.channelName!);
        StateManager.emit('twitchChannelConfigFetched', config)
      });
    }
  }).catch(err => ChoobLogger.error(err))

  twitchManager = new TwitchManager(auth, { channels: channels });

  StateManager.on('ready', () => {
    ChoobLogger.debug('onReady')
  })
  StateManager.on('setupDatabaseManually', async () => {

    // await CustomCommandModel.find({}).then((commands) => {
    //   commands.forEach(command => {
    //     let name = command.info.channel;
    //     let channel = command.info.name;
    //     command.info.name = name;
    //     command.info.channel = channel;
    //     command.save();
    //   });
    // })
  })
  await registerCommands(twitchManager, '../commands');
  await registerEvents(twitchManager, '../events');
  await twitchManager.connect();
}