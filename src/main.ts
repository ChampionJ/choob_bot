require('dotenv').config()
import { Client, Message, User } from "discord.js";
import { connect } from "mongoose";
import { ChoobBotLocalSettings, ChoobBotSettings, TwitchManager } from "./types";
import { registerCommands, registerEvents } from "./utils/registry";
import StateManager from './utils/StateManager';
import { AccessToken, RefreshableAuthProvider, StaticAuthProvider, TokenInfo } from 'twitch-auth';
import TwitchTokens from "./database/schemas/TwitchTokens";


const util = require("util");
const winston = require('winston');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const settingsPath = "settings.json";
const localdataPath = "localdata.json";
const Discord = require('discord.js');
const logger = winston.loggers.get('main');

let settings: ChoobBotSettings;
let localdata: ChoobBotLocalSettings;
let discordClient: Client;
let twitchManager: TwitchManager;

async function main() {
  await setupLogger();
  await getSettings();
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
        //winston.format.json(),

        //winston.format.prettyPrint()
      ),
      defaultMeta: { service: 'choob_bot' },
      transports: [
        //
        // - Write to all logs with level `info` and below to `quick-start-combined.log`.
        // - Write all logs error (and below) to `quick-start-error.log`.
        //
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

async function getSettings() {
  await readFile(localdataPath).then((result: any) => {
    localdata = JSON.parse(result.toString())

  }).catch((err: any) => { console.log(err) })
  await readFile(settingsPath, 'utf8').then((result: any) => {
    settings = JSON.parse(result);
  }).catch((err: any) => { console.log(err) })
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
  // await readFile('tokens.json').then((result: any) => {
  //   tokenData = JSON.parse(result.toString())
  // }).catch((err: any) => { console.log(err) })

  tokenData = await TwitchTokens.findOne({});

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
        await TwitchTokens.replaceOne({}, { accessToken: newTokenData.accessToken, refreshToken: newTokenData.refreshToken, expiryTimestamp: newTokenData.expiryTimestamp })
      }
    }
  );

  twitchManager = new TwitchManager(auth, { channels: localdata.connectionSettings.channels });

  StateManager.on('ready', () => {
    logger.debug('onReady')
  })
  await registerCommands(twitchManager, '../commands');
  await registerEvents(twitchManager, '../events');
  await twitchManager.connect();
}



/*

function onGiftedSubsHandler(channel: string, username: string, numbOfSubs: number, methods: Object, userstate: Userstate) {
  if (checkIfExtraInfoChannel(channel)) {
    setTimeout(() => {
      let giftIndex = localdata.giftedsubs.length;
      let giftQuote = localdata.giftedsubs[0];
      if (numbOfSubs > 1) {
        giftQuote = localdata.giftedsubs[Math.floor(Math.random() * giftIndex)];
      }
      tclient.say(channel, giftQuote.replace('{gifter}', username).replace('{number}', numbOfSubs.toString()));
    }, numbOfSubs * 200 + 1000);
    //client.say(channel, settings.messages.giftedsubs.replace('{gifter}','@'+username));
  }
  logger.log('info', `There were ${numbOfSubs} gifted in ${channel} by ${username}`);
  //let senderCount = ~~userstate["msg-param-sender-count"];
}
// Called every time a message comes in
function onMessageHandler(target: string, context: Userstate, msg: string, self: boolean) {
  if (self) { return; } // Ignore messages from the bot
  // Remove whitespace from edges of chat message
  let messageString = msg.trim();
  if (messageString[0] != '!') { //check if they're trying to activate a command
    return;
  }
  messageString = messageString.substr(1);
  const commandTriggeredRAW: string = messageString.split(" ")[0].toLowerCase().replace(/-/g, "");
  let commandTriggered: string = commandTriggeredRAW;

  let command = settings.commands[commandTriggered];
  if (command === undefined) {
    let alias = settings.aliases[commandTriggered];
    if (alias === undefined) {
      return;
    } else {
      command = settings.commands[alias];
      commandTriggered = alias;
    }
  }

  logger.log('debug', JSON.stringify(command));

  if (command.choobbotChannelOnly === true) {
    if (checkIfChoobbotChannel(target) === false) {
      //client.say(target, "@"+context["display-name"]+" you lack the correct Choob permissions to execute this command!");
      return;
    }
  }
  let isUserSuperAdmin = checkIfSuperAdmin(context);

  if (!isUserSuperAdmin) {
    if (command.requiresSuperAdmin === true) {
      tclient.say(target, settings.permissionLackingMessage.replace('{name}', context["display-name"]!));
      logger.log('info', `${context["display-name"]} attempted to execute ${commandTriggered} command in ${target} but lacked Super Admin permission`);
      return;
    }
    if (command.requiresAdmin === true) {
      if (checkIfAdmin(context, target) === false) {
        tclient.say(target, settings.permissionLackingMessage.replace('{name}', context["display-name"]!));
        logger.log('info', `${context["display-name"]} attempted to execute ${commandTriggered} command in ${target} but lacked Admin permission`);
        return;
      }
    }
    if (command.requiresMod === true) {
      if (checkIfMod(context, target) === false) {
        tclient.say(target, settings.permissionLackingMessage.replace('{name}', context["display-name"]!));
        logger.log('info', `${context["display-name"]} attempted to execute ${commandTriggered} command in ${target} but lacked Mod permission`);
        return;
      }
    }
  }
  switch (commandTriggered) {
    case "choob":
      if (localdata.choob.ignoredTwitchChannels.includes(target))
        break;
      let choobIndex = localdata.choob.messages.length;
      let choobQuote = localdata.choob.messages[Math.floor(Math.random() * choobIndex)];
      tclient.say(target, choobQuote);

      logger.log('verbose', `${context["display-name"]} executed ${commandTriggered} command in ${target}`);
      break;
    case "addchoobtochannel": {
      let channelToJoin = messageString.split(" ")[1].toLowerCase();
      let channelstring = "#" + channelToJoin;
      if (localdata.connectionSettings.channels!.includes(channelstring)) {
        tclient.say(target, command.existsMessage.replace('{channel}', channelToJoin));
        logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelToJoin}, but Choob_Bot is already in that channel`);
      } else {
        tclient.join(channelstring)
          .then(() => {
            localdata.connectionSettings.channels!.push(channelstring);
            fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: Error) => { if (e != null) logger.log('error', e); });
            tclient.say(target, command.joinMessage.replace('{channel}', channelToJoin));
            logger.log('info', `${context["display-name"]} added Choob_Bot to ${channelToJoin}`);

          })
          .catch(() => {
            tclient.say(target, command.doesntExist.replace('{channel}', channelToJoin));
            logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelToJoin}, but that channel doesn\'t exist`);
          });
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "removechoobfromchannel": {
      let channelToLeave = messageString.split(" ")[1].toLowerCase();
      const removalChannel = "#" + channelToLeave;
      let removalChannelIndex = localdata.connectionSettings.channels!.indexOf(removalChannel);
      if (removalChannelIndex != -1) {
        localdata.connectionSettings.channels!.splice(removalChannelIndex, 1);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        tclient.say(target, command.leaveMessage.replace('{channel}', channelToLeave));
        tclient.part(removalChannel);
        logger.log('info', `${context["display-name"]} removed Choob_Bot from ${channelToLeave}`);
      } else {
        tclient.say(target, command.errorMessage.replace('{channel}', channelToLeave));
        logger.log('info', `${context["display-name"]} attempted to remove Choob_Bot from ${channelToLeave}`);
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "joinchoob": {
      let channelstring = "#" + context.username;
      if (localdata.connectionSettings.channels!.includes(channelstring)) {
        tclient.say(target, command.existsMessage);
        logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelstring}, but Choob_Bot is already in that channel`);
      } else {
        localdata.connectionSettings.channels!.push(channelstring);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        tclient.say(target, command.joinMessage);
        tclient.join(channelstring);
        logger.log('info', `${context["display-name"]} added Choob_Bot to ${channelstring}`);
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "leavechoob": {
      const removalChannel = "#" + context.username;
      let removalChannelIndex = localdata.connectionSettings.channels!.indexOf(removalChannel);
      if (removalChannelIndex != -1) {
        localdata.connectionSettings.channels!.splice(removalChannelIndex, 1);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        tclient.say(target, command.leaveMessage);
        tclient.part(removalChannel);
        logger.log('info', `${context["display-name"]} removed Choob_Bot from ${removalChannel}`);
      }
      else {
        tclient.say(target, command.errorMessage);
        logger.log('info', `${context["display-name"]} attempted to remove Choob_Bot from ${removalChannel}`);
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "choobchannels":
      let channelCount = localdata.connectionSettings.channels!.length;
      tclient.say(target, command.message.replace('{count}', channelCount));

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobcount":
      let choobCount = localdata.choob.messages.length;
      tclient.say(target, command.message.replace('{count}', choobCount));

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobhelp":
      tclient.say(target, command.message);

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobinfo":
      let info = command.message;
      tclient.say(target, info);

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobversion":
      tclient.say(target, command.message);

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "togglechoob":
      let exists = localdata.choob.ignoredTwitchChannels.indexOf(target);
      if (exists >= 0) {
        localdata.choob.ignoredTwitchChannels.splice(exists, 1);
        tclient.say(target, command.onMessage);
      } else {
        localdata.choob.ignoredTwitchChannels.push(target);
        tclient.say(target, command.offMessage);
      }
      fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });

      logger.log('info', `${context["display-name"]} executed ${commandTriggered} command in ${target}`);
      break;
    case "addchoob":
      if (messageString.length < commandTriggeredRAW.length + 2) {
        break;
      }
      const choobString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
      for (let msgnum = 0; msgnum < localdata.choob.messages.length; msgnum++) {
        if (stringSimilarity(localdata.choob.messages[msgnum], choobString) > 0.8) {
          tclient.say(target, command.duplicateMsg.replace('{username}', context["display-name"]));

          logger.log('info', `* Attempted to add duplicate choob quote.\n\"${choobString}\"\nmatched\n"${localdata.choob.messages[msgnum]}\"`);
          return;
        }
      }
      localdata.choob.messages.push(choobString);
      fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) { logger.log('error', e); } });
      tclient.say(target, command.message.replace('{msg}', choobString));

      logger.log('info', `* ${context["display-name"]} added:\n\"${choobString}\"\nto the choob list`);
      break;
    case "removechoob":
      if (messageString.length < commandTriggeredRAW.length + 2) {
        break;
      }
      const removalString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
      let removalIndex = localdata.choob.messages.indexOf(removalString);
      if (removalIndex != -1) {
        localdata.choob.messages.splice(removalIndex, 1);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        tclient.say(target, command.message.replace('{msg}', removalString));

        logger.log('info', `* ${context["display-name"]} removed:\n\"${removalString}\"\nfrom the choob list`);
      } else {
        tclient.say(target, command.messageNoMatch.replace('{username}', context["display-name"]));

        logger.log('info', `* ${context["display-name"]} attempted to remove non-matching choob:\n\"${removalString}\"\nfrom the choob list`);
      }
      break;
    case "addgiftquote":
      if (messageString.length < commandTriggeredRAW.length + 2) {
        break;
      }
      const giftString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
      for (let msgnum = 0; msgnum < localdata.giftedsubs.length; msgnum++) {
        if (stringSimilarity(localdata.giftedsubs[msgnum], giftString) > 0.8) {
          tclient.say(target, command.duplicateMsg.replace('{username}', context["display-name"]));

          logger.log('info', `* Attempted to add duplicate gift quote.\n\"${giftString}\"\nmatched\n"${localdata.giftedsubs[msgnum]}\"`);
          return;
        }
      }
      localdata.giftedsubs.push(giftString);
      fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
      tclient.say(target, command.message.replace('{msg}', giftString));

      logger.log('info', `* ${context["display-name"]} added:\n\"${giftString}\"\nto the gift quote list`);
      break;
    case "removegiftquote":
      if (messageString.length < commandTriggeredRAW.length + 2) {
        break;
      }
      const giftRemovalString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
      let giftRemovalIndex = localdata.giftedsubs.indexOf(giftRemovalString);
      if (giftRemovalIndex != -1) {
        localdata.giftedsubs.splice(giftRemovalIndex, 1);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        tclient.say(target, command.message.replace('{msg}', giftRemovalString));

        logger.log('info', `* ${context["display-name"]} removed:\n\"${giftRemovalString}\"\nfrom the gift quote list`);
      } else {
        tclient.say(target, command.messageNoMatch.replace('{username}', context["display-name"]));

        logger.log('info', `* ${context["display-name"]} attempted to remove non-matching quote:\n\"${giftRemovalString}\"\nfrom the gift quote list`);
      }
      break;
    case "updatechoob":
      try {
        localdata = JSON.parse(fs.readFileSync(localdataPath));
        tclient.say(target, command.successMessage);

        logger.log('info', `${context["display-name"]} executed ${commandTriggered} command in ${target}`);
      }
      catch (err) {
        logger.log('error', err);
        tclient.say(target, command.failMessage);
      }
      break;
    default:
      logger.log('debug', `* Unknown command ${commandTriggered}`);
      break;
  }
  return;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr: string, port: number) {
  logger.log('debug', `* Connected to ${addr}:${port}`);
}
function checkIfMod(context: Userstate, target: string) {
  return context.mod == true || context.username == target.substr(1);
}
function checkIfAdmin(context: Userstate, target: string) {
  if (checkIfMod(context, target) === true && settings.adminChannels.includes(target))
    return true;
  return false;
}
function checkIfSuperAdmin(context: Userstate) {
  return settings.superAdmins.includes(context.username);
}
function checkIfChoobbotChannel(target: string) {
  return target === "#choob_bot";
}
function checkIfExtraInfoChannel(target: string) {
  return localdata.extraInfoChannels.includes(target);
}

function stringSimilarity(s1: string, s2: string) {
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

*/