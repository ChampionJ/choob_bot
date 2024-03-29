// require('dotenv').config()
import dotenv from "dotenv";
dotenv.config();
import {
  Client,
  Collection,
  Guild,
  Intents,
  Message,
  MessageReaction,
  Role,
  User,
} from "discord.js";
import {
  registerCommands,
  registerDatabaseCommands,
  registerDiscordDatabaseCommands,
  registerEvents,
} from "./utils/registry";
import StateManager from "./utils/StateManager";
import { RefreshableAuthProvider, StaticAuthProvider } from "twitch-auth";
import { APITokenModel } from "./structures/databaseTypes/schemas/TwitchTokens";
import { TwitchChannelConfigModel } from "./structures/databaseTypes/schemas/TwitchChannelConfig";
import { TwitchManager } from "./twitch/TwitchClientManager";
import { ChoobLogger } from "./utils/ChoobLogger";
import { ApiClient } from "twitch";
import { createCipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

// const util = require("util");
import Discord from "discord.js";
import { TwitchCustomCommandModel } from "./structures/databaseTypes/schemas/SimpleCommand";
import { DiscordManager } from "./discord/DiscordClientManager";

let discordClient: DiscordManager;
let twitchManager: TwitchManager;

async function main() {
  setupDiscord();
  if (process.env.LOGGING_LEVEL !== "DEVELOPMENT") {
    setupTwitch();
  }
}
main();

async function setupDiscord() {
  // discordClient = new Discord.Client({
  //   partials: ["MESSAGE", "CHANNEL", "REACTION"],
  // });
  discordClient = new DiscordManager();

  await registerCommands(discordClient, "../discord/commands");
  await registerDiscordDatabaseCommands(discordClient);
  await registerEvents(discordClient, "../discord/events");

  await discordClient.login(process.env.DISCORD_TOKEN);
  //await discordClient.updateRestCommands();

  // discordClient.on("ready", () => {
  //   ChoobLogger.info(
  //     "Connected to Discord as " +
  //       discordClient.user?.tag +
  //       " - (" +
  //       discordClient.user?.id +
  //       ")"
  //   );
  // });
  // discordClient.on("message", (msg: Message) => {});
}

async function setupTwitch() {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!;
  //let tokenData: any;
  const identifier = "Choob_Bot_Twitch_API";
  const tokenData = await APITokenModel.findOne({ identifier: identifier });
  if (!tokenData) {
    return;
  }

  const auth = new RefreshableAuthProvider(
    new StaticAuthProvider(clientId, tokenData.accessToken),
    {
      clientSecret,
      refreshToken: tokenData.refreshToken,
      expiry:
        tokenData.expiryTimestamp === null
          ? null
          : new Date(tokenData.expiryTimestamp),
      onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
        const newTokenData = {
          accessToken,
          refreshToken,
          expiryTimestamp:
            expiryDate === null ? undefined : expiryDate.getTime(),
        };
        await APITokenModel.updateOne(
          { identifier: identifier },
          {
            accessToken: newTokenData.accessToken,
            refreshToken: newTokenData.refreshToken,
            expiryTimestamp: newTokenData.expiryTimestamp,
          }
        );
      },
    }
  );

  const channels: string[] = [];
  await TwitchChannelConfigModel.find({ botIsInChannel: true })
    .then((configs) => {
      if (configs != null) {
        configs.forEach((config) => {
          channels.push(config.channelName!);
          StateManager.emit("twitchChannelConfigFetched", config);
        });
      }
    })
    .catch((err) => ChoobLogger.error(err));

  twitchManager = new TwitchManager(auth, { channels: channels });

  StateManager.on("ready", () => {
    ChoobLogger.debug("onReady");

    // const newCom = new TwitchCustomCommandModel({ channelId: '77430906', name: 'shoutout', response: `Checkout @{arg1}'s channel! https://twitch.tv/{arg1}`, channelName: '#futureghost' })
    // newCom.save();
    // const newCom2 = new TwitchCustomCommandModel({ channelId: '48112322', name: 'so', response: `Checkout @{arg1}'s channel! https://twitch.tv/{arg1}`, channelName: '#lord_durok' })
    // newCom2.save();
  });
  StateManager.on("setupDatabaseManually", async (username) => {
    //test
  });

  await registerCommands(twitchManager, "../twitch/commands");
  await registerDatabaseCommands(twitchManager);
  await registerEvents(twitchManager, "../twitch/events");
  await twitchManager.connect();
}
