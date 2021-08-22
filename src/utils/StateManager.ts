import { mongoose, DocumentType, getClass } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import { ChangeEvent } from "mongodb";
import {
  ChoobQuote,
  ChoobQuoteModel,
} from "../structures/databaseTypes/schemas/ChoobMessage";
import {
  DiscordGlobalSimpleCommand,
  TwitchCustomCommand,
  TwitchCustomCommandModel,
  TwitchGlobalSimpleCommand,
} from "../structures/databaseTypes/schemas/SimpleCommand";
import {
  TwitchChannelConfig,
  TwitchChannelConfigModel,
} from "../structures/databaseTypes/schemas/TwitchChannelConfig";
import {
  TwitchEventMessageGiftedSubs,
  TwitchEventMessageGiftedSubsModel,
} from "../structures/databaseTypes/schemas/TwitchGiftedSubsMessage";
import { ChoobLogger } from "./ChoobLogger";
import { DiscordGuildConfig } from "../structures/databaseTypes/schemas/DiscordGuildConfig";

interface StateManager {
  on(
    event: "twitchChannelConfigFetched",
    listener: (config: TwitchChannelConfig) => void
  ): this;
  on(
    event: "twitchChannelConfigUpdated",
    listener: (config: TwitchChannelConfig) => void
  ): this;
  on(
    event: "discordGuildConfigFetched",
    listener: (config: DiscordGuildConfig) => void
  ): this;
  on(
    event: "discordGuildConfigUpdated",
    listener: (config: DiscordGuildConfig) => void
  ): this;
  on(event: "ready", listener: () => void): this;
  on(event: "choobFetched", listener: (choobMessage: ChoobQuote) => void): this;
  on(
    event: "choobRemoved",
    listener: (index: number, removedQuote: string) => void
  ): this;
  on(
    event: "commandUpdated",
    listener: (
      oldCommand: TwitchGlobalSimpleCommand,
      command: TwitchGlobalSimpleCommand | undefined
    ) => void
  ): this;
  on(
    event: "discordCommandUpdated",
    listener: (
      oldCommand: DiscordGlobalSimpleCommand,
      command: DiscordGlobalSimpleCommand | undefined
    ) => void
  ): this;
  on(event: "setupDatabaseManually", listener: (data: any) => void): this;
  on(
    event: "twitchGiftedSubsMessageFetched",
    listener: (giftedSubsMessage: TwitchEventMessageGiftedSubs) => void
  ): this;
  on(
    event: "twitchGiftedSubsMessageRemoved",
    listener: (index: number, removedQuote: string) => void
  ): this;
  on(
    event: "botInChatUpdate",
    listener: (channel: string, shouldJoin: boolean) => void
  ): this;
}

class StateManager extends EventEmitter {
  connection: import("mongoose").Connection;
  _twitchChannelConfigs: Map<string, TwitchChannelConfig>;
  _discordGuildConfigs: Map<string, DiscordGuildConfig>;
  _choobs: ChoobQuote[];
  _giftedSubQuotes: TwitchEventMessageGiftedSubs[];

  get twitchChannelConfigs(): Map<string, TwitchChannelConfig> {
    return this._twitchChannelConfigs;
  }
  get discordGuildConfigs(): Map<string, DiscordGuildConfig> {
    return this._discordGuildConfigs;
  }
  get choobs(): ChoobQuote[] {
    return this._choobs;
  }
  get giftedSubQuotes(): TwitchEventMessageGiftedSubs[] {
    return this._giftedSubQuotes;
  }

  constructor(options: any) {
    super(options);
    this.connection = connection;
    this._twitchChannelConfigs = new Map();
    this._discordGuildConfigs = new Map();
    this._choobs = [];
    this._giftedSubQuotes = [];
    this.on("twitchChannelConfigFetched", this.channelFetched);
    this.on("discordGuildConfigFetched", this.guildFetched);
    this.on("choobFetched", this.choobFetched);
    this.on("twitchGiftedSubsMessageFetched", this.giftedSubMessageFetched);
    connect(process.env.DATABASE!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    this.setupStateFromDatabase();
  }
  channelFetched(config: TwitchChannelConfig) {
    ChoobLogger.info(`Fetched config for ${config.channelName}`);
    this._twitchChannelConfigs.set(config.channelName!, config);
  }
  guildFetched(config: DiscordGuildConfig) {
    ChoobLogger.info(`Fetched config for ${config.guildName}`);
    this._discordGuildConfigs.set(config.guildName!, config);
  }
  choobFetched(choobMessage: ChoobQuote) {
    ChoobLogger.info(`Fetched choob ${choobMessage.quote}`);
    this._choobs.push(choobMessage);
  }
  giftedSubMessageFetched(giftedSubsMessage: TwitchEventMessageGiftedSubs) {
    ChoobLogger.info(`Fetched choob ${giftedSubsMessage.message}`);
    this._giftedSubQuotes.push(giftedSubsMessage);
  }

  async setupStateFromDatabase() {
    await ChoobQuoteModel.find({})
      .then((choobModels) => {
        if (choobModels != null) {
          choobModels.forEach((choob) => {
            this._choobs.push(choob);
          });
        }
      })
      .catch((err) => ChoobLogger.error(err));

    await TwitchEventMessageGiftedSubsModel.find({})
      .then((quoteModels) => {
        if (quoteModels != null) {
          quoteModels.forEach((quote) => {
            this._giftedSubQuotes.push(quote);
          });
        }
      })
      .catch((err) => ChoobLogger.error(err));

    ChoobQuoteModel.watch().on("change", (change) =>
      this.onChoobMessageChange(change)
    );
    TwitchChannelConfigModel.watch(undefined, {
      fullDocument: "updateLookup",
    }).on("change", (change) => this.onTwitchChannelConfigChange(change));
    TwitchEventMessageGiftedSubsModel.watch().on("change", (change) =>
      this.onTwitchGiftedSubMessageChange(change)
    );
  }

  onChoobMessageChange(change: ChangeEvent<ChoobQuote>) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(`Deleted a choob: ${change.documentKey._id}`);
      const deletedChoob = this._choobs.findIndex((choob: ChoobQuote) =>
        choob._id?.equals(change.documentKey._id)
      );
      if (deletedChoob >= 0) {
        ChoobLogger.debug("Found the deleted choob in local array!");
        this._choobs.splice(deletedChoob, 1);
      }
    } else if (change.operationType === "insert") {
      ChoobLogger.debug(`Added a choob! ${change.documentKey._id}`);
      const insertedChoob = this._choobs.findIndex((choob: ChoobQuote) =>
        choob._id?.equals(change.documentKey._id)
      );
      if (insertedChoob < 0) {
        ChoobLogger.debug("Didn't find the added choob in local array!");
        this._choobs.push(change.fullDocument as DocumentType<ChoobQuote>);
      }
    } else if (change.operationType === "update") {
      ChoobLogger.debug(`Updated a choob!`);
      const updatedChoobIndex = this._choobs.findIndex((choob: ChoobQuote) =>
        choob._id?.equals(change.documentKey._id)
      );
      if (updatedChoobIndex >= 0) {
        ChoobLogger.debug("Found the updated choob in local array!");
        if (change.updateDescription.updatedFields.quote !== undefined) {
          this._choobs[updatedChoobIndex].quote =
            change.updateDescription.updatedFields.quote;
        }
      }
    }
  }

  onTwitchChannelConfigChange(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(
        `Deleted a twitch channel config: ${change.documentKey._id}`
      );
      let deletedConfig = "";
      for (const [channelName, value] of this._twitchChannelConfigs.entries()) {
        if (value._id?.equals(change.documentKey._id as string)) {
          deletedConfig = channelName;
          break;
        }
      }
      if (deletedConfig !== "") {
        ChoobLogger.debug("Found the deleted channel config in local array!");
        this._twitchChannelConfigs.delete(deletedConfig);
      }
    } else if (change.operationType === "insert") {
      ChoobLogger.debug(
        `Added a twitch channel config! ${change.documentKey._id}`
      );
      if (!this._twitchChannelConfigs.has(change.fullDocument.channelName)) {
        ChoobLogger.debug("Didn't find the added channel in local array!");
        this._twitchChannelConfigs.set(
          change.fullDocument.channelName,
          change.fullDocument as DocumentType<TwitchChannelConfig>
        );
      }
    } else if (change.operationType === "update") {
      ChoobLogger.debug(
        `Updated a channel config!`,
        change.updateDescription.updatedFields
      );
      if (this._twitchChannelConfigs.has(change.fullDocument.channelName)) {
        ChoobLogger.debug("Found the added channel in local array!");
        this._twitchChannelConfigs.set(
          change.fullDocument.channelName,
          change.fullDocument as DocumentType<TwitchChannelConfig>
        );
      }
      ChoobLogger.debug(`About to check botisinchannel!`);
      if (change.updateDescription.updatedFields.botIsInChannel !== undefined) {
        ChoobLogger.debug(`Changed bot in channel!`);
        this.emit(
          "botInChatUpdate",
          change.fullDocument.channelName,
          change.fullDocument.botIsInChannel
        );
      }
    }
  }

  onTwitchGiftedSubMessageChange(
    change: ChangeEvent<TwitchEventMessageGiftedSubs>
  ) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(
        `Deleted a gifted sub message: ${change.documentKey._id}`
      );
      const deletedMessage = this._giftedSubQuotes.findIndex(
        (giftedMessage: TwitchEventMessageGiftedSubs) =>
          giftedMessage._id?.equals(change.documentKey._id)
      );
      if (deletedMessage >= 0) {
        ChoobLogger.debug(
          "Found the deleted gifted sub message in local array!"
        );
        this._giftedSubQuotes.splice(deletedMessage, 1);
      }
    } else if (change.operationType === "insert") {
      ChoobLogger.debug(
        `Added a gifted sub message! ${change.documentKey._id}`
      );
      const insertedMessage = this._giftedSubQuotes.findIndex(
        (giftedMessage: TwitchEventMessageGiftedSubs) =>
          giftedMessage._id?.equals(change.documentKey._id)
      );
      if (insertedMessage < 0) {
        ChoobLogger.debug(
          "Didn't find the added gifted sub message in local array!"
        );
        this._giftedSubQuotes.push(
          change.fullDocument as DocumentType<TwitchEventMessageGiftedSubs>
        );
      }
    } else if (change.operationType === "update") {
      ChoobLogger.debug(`Updated a gifted sub message!`);
      const updatedMessageIndex = this._giftedSubQuotes.findIndex(
        (giftedMessage: TwitchEventMessageGiftedSubs) =>
          giftedMessage._id?.equals(change.documentKey._id)
      );
      if (updatedMessageIndex >= 0) {
        ChoobLogger.debug(
          "Found the updated gifted sub message in local array!"
        );
        if (change.updateDescription.updatedFields.message !== undefined) {
          this._giftedSubQuotes[updatedMessageIndex].message =
            change.updateDescription.updatedFields.message;
        }
        if (change.updateDescription.updatedFields.minimumGifts !== undefined) {
          this._giftedSubQuotes[updatedMessageIndex].minimumGifts =
            change.updateDescription.updatedFields.minimumGifts;
        }
      }
    }
  }

  onDiscordGuildConfigChange(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(
        `Deleted a discord guild config: ${change.documentKey._id}`
      );
      let deletedConfig = "";
      for (const [channelName, value] of this._discordGuildConfigs.entries()) {
        if (value._id?.equals(change.documentKey._id as string)) {
          deletedConfig = channelName;
          break;
        }
      }
      if (deletedConfig !== "") {
        ChoobLogger.debug("Found the deleted guild config in local array!");
        this._discordGuildConfigs.delete(deletedConfig);
      }
    } else if (change.operationType === "insert") {
      ChoobLogger.debug(
        `Added a discord guild config! ${change.documentKey._id}`
      );
      if (!this._discordGuildConfigs.has(change.fullDocument.channelName)) {
        ChoobLogger.debug("Didn't find the added guild in local array!");
        this._discordGuildConfigs.set(
          change.fullDocument.channelName,
          change.fullDocument as DocumentType<DiscordGuildConfig>
        );
      }
    } else if (change.operationType === "update") {
      ChoobLogger.debug(
        `Updated a guild config!`,
        change.updateDescription.updatedFields
      );
      if (this._discordGuildConfigs.has(change.fullDocument.channelName)) {
        ChoobLogger.debug("Found the added guild in local array!");
        this._discordGuildConfigs.set(
          change.fullDocument.channelName,
          change.fullDocument as DocumentType<DiscordGuildConfig>
        );
      }
      ChoobLogger.debug(`About to check botisinchannel!`);
      if (change.updateDescription.updatedFields.botIsInChannel !== undefined) {
        ChoobLogger.debug(`Changed bot in channel!`);
        this.emit(
          "botInChatUpdate",
          change.fullDocument.channelName,
          change.fullDocument.botIsInChannel
        );
      }
    }
  }
}

export = new StateManager(undefined);
