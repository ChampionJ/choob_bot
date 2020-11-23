import { Client, Message, User } from "discord.js";
import { ClientBase, Userstate } from "tmi.js";
import { TwitchClient, ChoobBotLocalSettings, ChoobBotSettings, ConnectionSettings } from "./types";


require('dotenv').config()

const util = require("util");


const tmi = require("tmi.js");
const winston = require('winston');

const fs = require('fs');
const readFile = util.promisify(fs.readFile);

const settingsPath = "settings.json";
const localdataPath = "localdata.json";

const Discord = require('discord.js');

//setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'choob_bot' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new winston.transports.File({ filename: 'logs/choob_bot-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/choob_bot-info.log', level: 'info' }),
    new winston.transports.File({ filename: 'logs/choob_bot-combined.log', level: 'verbose' })
  ]
});

if (process.env.NODE_ENV != 'production') {
  logger.remove(winston.transports.Console);
  logger.add(new winston.transports.Console({
    colorize: true
  }));
  logger.level = 'debug';
}

logger.log('info', 'Running in: ' + process.env.NODE_ENV)

let settings: ChoobBotSettings;
let localdata: ChoobBotLocalSettings;



///Discord Bot
let discordClient: Client = new Discord.Client({
  partials: ['MESSAGE', 'REACTION']
});
let client: TwitchClient;


readFile(localdataPath).then((result: any) => {
  localdata = JSON.parse(result.toString())
  readFile(settingsPath, 'utf8').then((result: any) => {
    settings = JSON.parse(result);
    loginToStuff()
  })
}).catch((err: any) => { console.log(err) })


function loginToStuff() {

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

  //create twitch client
  let connection = {
    options: {
      debug: false
    },
    connection: {
      reconnect: true
    },
    identity: {
      username: process.env.TWITCH_USERNAME!,
      password: process.env.TWITCH_PASS!
    },
    channels: localdata.connectionSettings.channels
  }

  client = new tmi.client(connection);
  // Register our event handlers
  client.on('message', onMessageHandler);
  client.on('connected', onConnectedHandler);
  client.on("submysterygift", onGiftedSubsHandler);
  // Connect to Twitch:
  client.connect();
}

function onGiftedSubsHandler(channel: string, username: string, numbOfSubs: number, methods: Object, userstate: Userstate) {
  if (checkIfExtraInfoChannel(channel)) {
    setTimeout(() => {
      let giftIndex = localdata.giftedsubs.length;
      let giftQuote = localdata.giftedsubs[0];
      if (numbOfSubs > 1) {
        giftQuote = localdata.giftedsubs[Math.floor(Math.random() * giftIndex)];
      }
      client.say(channel, giftQuote.replace('{gifter}', username).replace('{number}', numbOfSubs.toString()));
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
      client.say(target, settings.permissionLackingMessage.replace('{name}', context["display-name"]!));
      logger.log('info', `${context["display-name"]} attempted to execute ${commandTriggered} command in ${target} but lacked Super Admin permission`);
      return;
    }
    if (command.requiresAdmin === true) {
      if (checkIfAdmin(context, target) === false) {
        client.say(target, settings.permissionLackingMessage.replace('{name}', context["display-name"]!));
        logger.log('info', `${context["display-name"]} attempted to execute ${commandTriggered} command in ${target} but lacked Admin permission`);
        return;
      }
    }
    if (command.requiresMod === true) {
      if (checkIfMod(context, target) === false) {
        client.say(target, settings.permissionLackingMessage.replace('{name}', context["display-name"]!));
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
      client.say(target, choobQuote);

      logger.log('verbose', `${context["display-name"]} executed ${commandTriggered} command in ${target}`);
      break;
    case "addchoobtochannel": {
      let channelToJoin = messageString.split(" ")[1].toLowerCase();
      let channelstring = "#" + channelToJoin;
      if (localdata.connectionSettings.channels.includes(channelstring)) {
        client.say(target, command.existsMessage.replace('{channel}', channelToJoin));
        logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelToJoin}, but Choob_Bot is already in that channel`);
      } else {
        client.join(channelstring)
          .then(() => {
            localdata.connectionSettings.channels.push(channelstring);
            fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: Error) => { if (e != null) logger.log('error', e); });
            client.say(target, command.joinMessage.replace('{channel}', channelToJoin));
            logger.log('info', `${context["display-name"]} added Choob_Bot to ${channelToJoin}`);

          })
          .catch(() => {
            client.say(target, command.doesntExist.replace('{channel}', channelToJoin));
            logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelToJoin}, but that channel doesn\'t exist`);
          });
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "removechoobfromchannel": {
      let channelToLeave = messageString.split(" ")[1].toLowerCase();
      const removalChannel = "#" + channelToLeave;
      let removalChannelIndex = localdata.connectionSettings.channels.indexOf(removalChannel);
      if (removalChannelIndex != -1) {
        localdata.connectionSettings.channels.splice(removalChannelIndex, 1);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        client.say(target, command.leaveMessage.replace('{channel}', channelToLeave));
        client.part(removalChannel);
        logger.log('info', `${context["display-name"]} removed Choob_Bot from ${channelToLeave}`);
      } else {
        client.say(target, command.errorMessage.replace('{channel}', channelToLeave));
        logger.log('info', `${context["display-name"]} attempted to remove Choob_Bot from ${channelToLeave}`);
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "joinchoob": {
      let channelstring = "#" + context.username;
      if (localdata.connectionSettings.channels.includes(channelstring)) {
        client.say(target, command.existsMessage);
        logger.log('info', `${context["display-name"]} attempted to add Choob_Bot to ${channelstring}, but Choob_Bot is already in that channel`);
      } else {
        localdata.connectionSettings.channels.push(channelstring);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        client.say(target, command.joinMessage);
        client.join(channelstring);
        logger.log('info', `${context["display-name"]} added Choob_Bot to ${channelstring}`);
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "leavechoob": {
      const removalChannel = "#" + context.username;
      let removalChannelIndex = localdata.connectionSettings.channels.indexOf(removalChannel);
      if (removalChannelIndex != -1) {
        localdata.connectionSettings.channels.splice(removalChannelIndex, 1);
        fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
        client.say(target, command.leaveMessage);
        client.part(removalChannel);
        logger.log('info', `${context["display-name"]} removed Choob_Bot from ${removalChannel}`);
      }
      else {
        client.say(target, command.errorMessage);
        logger.log('info', `${context["display-name"]} attempted to remove Choob_Bot from ${removalChannel}`);
      }
      logger.log('debug', `* Executed ${commandTriggered} command in ${target}`);
      break;
    }
    case "choobchannels":
      let channelCount = localdata.connectionSettings.channels.length;
      client.say(target, command.message.replace('{count}', channelCount));

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobcount":
      let choobCount = localdata.choob.messages.length;
      client.say(target, command.message.replace('{count}', choobCount));

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobhelp":
      client.say(target, command.message);

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobinfo":
      let info = command.message;
      client.say(target, info);

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "choobversion":
      client.say(target, command.message);

      logger.log('info', `${context["display-name"]} Executed ${commandTriggered} command in ${target}`);
      break;
    case "togglechoob":
      let exists = localdata.choob.ignoredTwitchChannels.indexOf(target);
      if (exists >= 0) {
        localdata.choob.ignoredTwitchChannels.splice(exists, 1);
        client.say(target, command.onMessage);
      } else {
        localdata.choob.ignoredTwitchChannels.push(target);
        client.say(target, command.offMessage);
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
          client.say(target, command.duplicateMsg.replace('{username}', context["display-name"]));

          logger.log('info', `* Attempted to add duplicate choob quote.\n\"${choobString}\"\nmatched\n"${localdata.choob.messages[msgnum]}\"`);
          return;
        }
      }
      localdata.choob.messages.push(choobString);
      fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) { logger.log('error', e); } });
      client.say(target, command.message.replace('{msg}', choobString));

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
        client.say(target, command.message.replace('{msg}', removalString));

        logger.log('info', `* ${context["display-name"]} removed:\n\"${removalString}\"\nfrom the choob list`);
      } else {
        client.say(target, command.messageNoMatch.replace('{username}', context["display-name"]));

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
          client.say(target, command.duplicateMsg.replace('{username}', context["display-name"]));

          logger.log('info', `* Attempted to add duplicate gift quote.\n\"${giftString}\"\nmatched\n"${localdata.giftedsubs[msgnum]}\"`);
          return;
        }
      }
      localdata.giftedsubs.push(giftString);
      fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e: any) => { if (e != null) logger.log('error', e); });
      client.say(target, command.message.replace('{msg}', giftString));

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
        client.say(target, command.message.replace('{msg}', giftRemovalString));

        logger.log('info', `* ${context["display-name"]} removed:\n\"${giftRemovalString}\"\nfrom the gift quote list`);
      } else {
        client.say(target, command.messageNoMatch.replace('{username}', context["display-name"]));

        logger.log('info', `* ${context["display-name"]} attempted to remove non-matching quote:\n\"${giftRemovalString}\"\nfrom the gift quote list`);
      }
      break;
    case "updatechoob":
      try {
        localdata = JSON.parse(fs.readFileSync(localdataPath));
        client.say(target, command.successMessage);

        logger.log('info', `${context["display-name"]} executed ${commandTriggered} command in ${target}`);
      }
      catch (err) {
        logger.log('error', err);
        client.say(target, command.failMessage);
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