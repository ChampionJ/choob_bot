import { mongoose, DocumentType, getClass } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import { ChangeEvent } from "mongodb"
import winston from "winston";
import { ChoobMessage, ChoobMessageModel } from "../database/schemas/ChoobMessage";
import { SimpleCommand } from "../database/schemas/SimpleCommand";
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
    this.on('twitchChannelConfigUpdated', this.channelUpdated);
    this.on('choobFetched', this.choobFetched);
    this.on('choobRemoved', this.choobRemoved);
    //this.on('commandUpdated', this.choobRemoved)
    this.on('twitchGiftedSubsMessageFetched', this.giftedSubMessageFetched);
    this.on('twitchGiftedSubsMessageRemoved', this.giftedSubMessageRemoved);
    connect(process.env.DATABASE!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    this.setupStateFromDatabase();

  }
  channelFetched(config: TwitchChannelConfig) {
    logger.info(`Fetched config for ${config.channelName}`);
    this._twitchChannelConfigs.set(config.channelName!, config);
  };
  channelUpdated(config: TwitchChannelConfig) {
    logger.info(`Fetched config for ${config.channelName}`);
    this._twitchChannelConfigs.set(config.channelName!, config);
  };
  choobFetched(choobMessage: ChoobMessage) {
    logger.info(`Fetched choob ${choobMessage.message}`);
    this._choobs.push(choobMessage);
  };
  choobRemoved(choobIndex: number, removedQuote: string) {
    logger.info(`Removed choob ${this._choobs[choobIndex].message}`);
    logger.debug(`Local: ${this._choobs[choobIndex]._id}`)
    //this._choobs.splice(choobIndex, 1);
  };
  giftedSubMessageFetched(giftedSubsMessage: TwitchGiftedSubsMessage) {
    logger.info(`Fetched choob ${giftedSubsMessage.message}`);
    this._giftedSubQuotes.push(giftedSubsMessage);
  }
  giftedSubMessageRemoved(quoteIndex: number, removedQuote: string) {
    logger.info(`Removed gifted sub quote ${this._giftedSubQuotes[quoteIndex].message}`);
    this._giftedSubQuotes.splice(quoteIndex, 1);
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

    ChoobMessageModel.watch().on('change', (change) => this.testing(change))
  }
  testing(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      logger.debug("Deleted a choob!")
      logger.debug(`Remote: ${change.documentKey._id}`)
      const deletedChoob = this._choobs.findIndex((choob: ChoobMessage) => choob._id?.equals(change.documentKey._id as string))
      if (deletedChoob >= 0) {
        logger.debug("Found the deleted choob in local array!")
        this._choobs.splice(deletedChoob, 1);
      }
      //logger.debug(`${this._choobs.length}`)
    }
  }
}

export = new StateManager(undefined);