import { mongoose, DocumentType, getClass } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import { ChangeEvent } from "mongodb"
import winston from "winston";
import { ChoobMessage, ChoobMessageModel } from "../database/schemas/ChoobMessage";
import { SimpleCommand, SimpleCommandModel } from "../database/schemas/SimpleCommand";
import { TwitchChannelConfig, TwitchChannelConfigModel } from '../database/schemas/TwitchChannelConfig';
import { TwitchGiftedSubsMessage, TwitchGiftedSubsMessageModel } from "../database/schemas/TwitchGiftedSubsMessage";

const logger = winston.loggers.get('main');

interface StateManager {
  on(event: 'twitchChannelConfigFetched', listener: (config: TwitchChannelConfig) => void): this;
  on(event: 'twitchChannelConfigUpdated', listener: (config: TwitchChannelConfig) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'choobFetched', listener: (choobMessage: ChoobMessage) => void): this;
  on(event: 'choobRemoved', listener: (index: number, removedQuote: string) => void): this;
  on(event: 'commandUpdated', listener: (oldCommandName: string, command: SimpleCommand | undefined) => void): this;
  on(event: 'setupDatabaseManually', listener: () => void): this;
  on(event: 'twitchGiftedSubsMessageFetched', listener: (giftedSubsMessage: TwitchGiftedSubsMessage) => void): this;
  on(event: 'twitchGiftedSubsMessageRemoved', listener: (index: number, removedQuote: string) => void): this;
}

class StateManager extends EventEmitter {
  connection: import("mongoose").Connection;
  _twitchChannelConfigs: Map<string, TwitchChannelConfig>;
  _choobs: ChoobMessage[];
  _giftedSubQuotes: TwitchGiftedSubsMessage[];

  get twitchChannelConfigs(): Map<string, TwitchChannelConfig> { return this._twitchChannelConfigs; }
  get choobs(): ChoobMessage[] { return this._choobs; }
  get giftedSubQuotes(): TwitchGiftedSubsMessage[] { return this._giftedSubQuotes; }

  constructor(options: any) {
    super(options);
    this.connection = connection
    this._twitchChannelConfigs = new Map();
    this._choobs = [];
    this._giftedSubQuotes = [];
    this.on('twitchChannelConfigFetched', this.channelFetched);
    this.on('choobFetched', this.choobFetched);
    this.on('twitchGiftedSubsMessageFetched', this.giftedSubMessageFetched);
    connect(process.env.DATABASE!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    this.setupStateFromDatabase();

  }
  channelFetched(config: TwitchChannelConfig) {
    logger.info(`Fetched config for ${config.channelName}`);
    this._twitchChannelConfigs.set(config.channelName!, config);
  };
  choobFetched(choobMessage: ChoobMessage) {
    logger.info(`Fetched choob ${choobMessage.message}`);
    this._choobs.push(choobMessage);
  };
  giftedSubMessageFetched(giftedSubsMessage: TwitchGiftedSubsMessage) {
    logger.info(`Fetched choob ${giftedSubsMessage.message}`);
    this._giftedSubQuotes.push(giftedSubsMessage);
  }

  async setupStateFromDatabase() {
    await ChoobMessageModel.find({}).then((choobModels) => {
      if (choobModels != null) {
        choobModels.forEach(choob => {
          this._choobs.push(choob);
        });
      }
    }).catch(err => logger.error(err))

    await TwitchGiftedSubsMessageModel.find({}).then((quoteModels) => {
      if (quoteModels != null) {
        quoteModels.forEach(quote => {
          this._giftedSubQuotes.push(quote);
        });
      }
    }).catch(err => logger.error(err))

    ChoobMessageModel.watch().on('change', (change) => this.onChoobMessageChange(change))
    TwitchChannelConfigModel.watch(undefined, { fullDocument: 'updateLookup' }).on('change', (change) => this.onTwitchChannelConfigChange(change))
    TwitchGiftedSubsMessageModel.watch().on('change', (change) => this.onTwitchGiftedSubMessageChange(change))
  }

  onChoobMessageChange(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      logger.debug(`Deleted a choob: ${change.documentKey._id}`)
      const deletedChoob = this._choobs.findIndex((choob: ChoobMessage) => choob._id?.equals(change.documentKey._id as string))
      if (deletedChoob >= 0) {
        logger.debug("Found the deleted choob in local array!")
        this._choobs.splice(deletedChoob, 1);
      }
    }
    else if (change.operationType === "insert") {
      logger.debug(`Added a choob! ${change.documentKey._id}`)
      const insertedChoob = this._choobs.findIndex((choob: ChoobMessage) => choob._id?.equals(change.documentKey._id as string))
      if (insertedChoob < 0) {
        logger.debug("Didn't find the added choob in local array!")
        this._choobs.push(change.fullDocument as DocumentType<ChoobMessage>);
      }
    }
    else if (change.operationType === "update") {
      logger.debug(`Updated a choob!`)
      const updatedChoobIndex = this._choobs.findIndex((choob: ChoobMessage) => choob._id?.equals(change.documentKey._id as string))
      if (updatedChoobIndex >= 0) {
        logger.debug("Found the updated choob in local array!")
        if (change.updateDescription.updatedFields.message !== undefined) {
          this._choobs[updatedChoobIndex].message = change.updateDescription.updatedFields.message;
        }
      }
    }
  }

  onTwitchChannelConfigChange(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      logger.debug(`Deleted a twitch channel config: ${change.documentKey._id}`)
      let deletedConfig = '';
      for (let [channelName, value] of this._twitchChannelConfigs.entries()) {
        if (value._id?.equals(change.documentKey._id as string)) {
          deletedConfig = channelName;
          break;
        }
      }
      if (deletedConfig !== '') {
        logger.debug("Found the deleted channel config in local array!")
        this._twitchChannelConfigs.delete(deletedConfig);
      }
    }
    else if (change.operationType === "insert") {
      logger.debug(`Added a twitch channel config! ${change.documentKey._id}`)
      if (!this._twitchChannelConfigs.has(change.fullDocument.channelName)) {
        logger.debug("Didn't find the added channel in local array!")
        this._twitchChannelConfigs.set(change.fullDocument.channelName, change.fullDocument as DocumentType<TwitchChannelConfig>);
      }
    }
    else if (change.operationType === "update") {
      logger.debug(`Updated a channel config!`)
      if (this._twitchChannelConfigs.has(change.fullDocument.channelName)) {
        logger.debug("Found the added channel in local array!")
        this._twitchChannelConfigs.set(change.fullDocument.channelName, change.fullDocument as DocumentType<TwitchChannelConfig>);
      }
    }
  }

  onTwitchGiftedSubMessageChange(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      logger.debug(`Deleted a gifted sub message: ${change.documentKey._id}`)
      const deletedMessage = this._giftedSubQuotes.findIndex((giftedMessage: TwitchGiftedSubsMessage) => giftedMessage._id?.equals(change.documentKey._id as string))
      if (deletedMessage >= 0) {
        logger.debug("Found the deleted gifted sub message in local array!")
        this._giftedSubQuotes.splice(deletedMessage, 1);
      }
    }
    else if (change.operationType === "insert") {
      logger.debug(`Added a gifted sub message! ${change.documentKey._id}`)
      const insertedMessage = this._giftedSubQuotes.findIndex((giftedMessage: TwitchGiftedSubsMessage) => giftedMessage._id?.equals(change.documentKey._id as string))
      if (insertedMessage < 0) {
        logger.debug("Didn't find the added gifted sub message in local array!")
        this._giftedSubQuotes.push(change.fullDocument as DocumentType<TwitchGiftedSubsMessage>);
      }
    }
    else if (change.operationType === "update") {
      logger.debug(`Updated a gifted sub message!`)
      const updatedMessageIndex = this._giftedSubQuotes.findIndex((giftedMessage: TwitchGiftedSubsMessage) => giftedMessage._id?.equals(change.documentKey._id as string))
      if (updatedMessageIndex >= 0) {
        logger.debug("Found the updated gifted sub message in local array!")
        if (change.updateDescription.updatedFields.message !== undefined) {
          this._giftedSubQuotes[updatedMessageIndex].message = change.updateDescription.updatedFields.message;
        }
        if (change.updateDescription.updatedFields.forMultipleGifts !== undefined) {
          this._giftedSubQuotes[updatedMessageIndex].forMultipleGifts = change.updateDescription.updatedFields.forMultipleGifts;
        }
      }
    }
  }

}

export = new StateManager(undefined);