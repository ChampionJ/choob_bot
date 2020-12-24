require('dotenv').config()
import { Client, Message, User } from "discord.js";
import { registerCommands, registerEvents } from "./utils/registry";
import StateManager from './utils/StateManager';
import { AccessToken, RefreshableAuthProvider, StaticAuthProvider, TokenInfo } from 'twitch-auth';
import { TwitchTokensModel } from "./database/schemas/TwitchTokens";
import { TwitchChannelConfigModel } from "./database/schemas/TwitchChannelConfig";
import { TwitchManager } from "./utils/TwitchClientManager";

const util = require("util");
const winston = require('winston');
const Discord = require('discord.js');
const logger = winston.loggers.get('main');
let discordClient: Client;
let twitchManager: TwitchManager;

async function main() {
  await setupLogger();
  //await getSettings();
  setupDiscord()
  setupTwitch()
}
main();

async function setupLogger() {
  winston.loggers.add('main',
    {
      level: 'info',
      format: winston.format.combine(

        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
      ),
      defaultMeta: { service: 'choob_bot' },
      transports: [
        new winston.transports.File({ filename: 'logs/choob_bot-error.log', level: 'error', handleExceptions: true }),
        new winston.transports.File({ filename: 'logs/choob_bot-info.log', level: 'info' }),
        new winston.transports.File({ filename: 'logs/choob_bot-combined.log', level: 'verbose' })
      ]
    });

  const checkEmpty = (info: any): string => {
    if (Object.keys(info).length > 2) {
      return '\n' + JSON.stringify(info, (key, value) => {
        if (key === 'timestamp' || key === 'service') {
          return undefined;
        }
        return value;
      }, 2)
    }
    return ''
  }
  if (process.env.NODE_ENV != 'production') {
    winston.loggers.get('main').add(new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.metadata(),
        winston.format.printf((info: any) => `${info.metadata.timestamp} ${info.level}: ${info.message} ${checkEmpty(info.metadata)}`),
      )
    }));
  }
  logger.info('Running in mode: ' + process.env.NODE_ENV)
}

async function setupDiscord() {
  discordClient = new Discord.Client({
    partials: ['MESSAGE', 'REACTION']
  });

  discordClient.login(process.env.DISCORD_TOKEN);

  discordClient.on('ready', () => {
    logger.info('Connected to Discord as ' + discordClient.user?.tag + ' - (' + discordClient.user?.id + ')');
  });
  discordClient.on('message', (msg: Message) => {
    logger.info(`Message: \n${msg}`)
    if (msg.content === '!zarnoth') {
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
  }).catch(err => logger.error(err))

  twitchManager = new TwitchManager(auth, { channels: channels });

  StateManager.on('ready', () => {
    logger.debug('onReady')
  })
  StateManager.on('setupDatabaseManually', async () => {

    // localdata.giftedsubs.forEach(async element => {
    //   await TwitchGiftedSubsMessageModel.create({ message: element, forMultipleGifts: element.includes('{number}') }).then((giftMessage: TwitchGiftedSubsMessage) => {
    //     logger.debug(`Added ${giftMessage.message} to database!`)
    //   }).catch((err) => {
    //     if (err.code !== 11000)
    //       logger.error(`Non-Duplicate error while adding ${element} to database`, err)
    //     if (err.code === 11000)
    //       logger.error(`Duplicate object error while adding ${element} to database`, err)
    //   })
    // });

  })
  await registerCommands(twitchManager, '../commands');
  await registerEvents(twitchManager, '../events');
  await twitchManager.connect();
}