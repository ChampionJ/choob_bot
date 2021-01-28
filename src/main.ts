require('dotenv').config()
import { Client, Message, User } from "discord.js";
import { registerCommands, registerDatabaseCommands, registerEvents } from "./utils/registry";
import StateManager from './utils/StateManager';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';
import { APITokenModel } from "./database/schemas/TwitchTokens";
import { TwitchChannelConfigModel } from "./database/schemas/TwitchChannelConfig";
import { TwitchManager } from "./utils/TwitchClientManager";
import { ChoobLogger } from "./utils/Logging";
import { ApiClient } from 'twitch';

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
  const identifier = 'Choob_Bot_Twitch_API'
  tokenData = await APITokenModel.findOne({ identifier: identifier });

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
        await APITokenModel.updateOne({ identifier: identifier }, { accessToken: newTokenData.accessToken, refreshToken: newTokenData.refreshToken, expiryTimestamp: newTokenData.expiryTimestamp })
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
  StateManager.on('setupDatabaseManually', async (username) => {

  });

  await registerCommands(twitchManager, '../commands');
  await registerDatabaseCommands(twitchManager);
  await registerEvents(twitchManager, '../events');
  await twitchManager.connect();
}

