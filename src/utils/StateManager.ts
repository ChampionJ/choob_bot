import { mongoose, DocumentType, getClass } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import { ChangeEvent } from "mongodb"
import { ChoobQuote, ChoobQuoteModel } from "../database/schemas/ChoobMessage";
import { TwitchCustomCommand, TwitchCustomCommandModel, TwitchGlobalSimpleCommand } from "../database/schemas/SimpleCommand";
import { TwitchChannelConfig, TwitchChannelConfigModel } from '../database/schemas/TwitchChannelConfig';
import { TwitchEventMessageGiftedSubs, TwitchEventMessageGiftedSubsModel } from "../database/schemas/TwitchGiftedSubsMessage";
import { ChoobLogger } from "./Logging";


interface StateManager {
  on(event: 'twitchChannelConfigFetched', listener: (config: TwitchChannelConfig) => void): this;
  on(event: 'twitchChannelConfigUpdated', listener: (config: TwitchChannelConfig) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'choobFetched', listener: (choobMessage: ChoobQuote) => void): this;
  on(event: 'choobRemoved', listener: (index: number, removedQuote: string) => void): this;
  on(event: 'commandUpdated', listener: (oldCommand: TwitchGlobalSimpleCommand, command: TwitchGlobalSimpleCommand | undefined) => void): this;
  on(event: 'setupDatabaseManually', listener: (data: any) => void): this;
  on(event: 'twitchGiftedSubsMessageFetched', listener: (giftedSubsMessage: TwitchEventMessageGiftedSubs) => void): this;
  on(event: 'twitchGiftedSubsMessageRemoved', listener: (index: number, removedQuote: string) => void): this;
}

class StateManager extends EventEmitter {
  connection: import("mongoose").Connection;
  _twitchChannelConfigs: Map<string, TwitchChannelConfig>;
  _choobs: ChoobQuote[];
  _giftedSubQuotes: TwitchEventMessageGiftedSubs[];

  get twitchChannelConfigs(): Map<string, TwitchChannelConfig> { return this._twitchChannelConfigs; }
  get choobs(): ChoobQuote[] { return this._choobs; }
  get giftedSubQuotes(): TwitchEventMessageGiftedSubs[] { return this._giftedSubQuotes; }

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
    ChoobLogger.info(`Fetched config for ${config.channelName}`);
    this._twitchChannelConfigs.set(config.channelName!, config);
  };
  choobFetched(choobMessage: ChoobQuote) {
    ChoobLogger.info(`Fetched choob ${choobMessage.quote}`);
    this._choobs.push(choobMessage);
  };
  giftedSubMessageFetched(giftedSubsMessage: TwitchEventMessageGiftedSubs) {
    ChoobLogger.info(`Fetched choob ${giftedSubsMessage.message}`);
    this._giftedSubQuotes.push(giftedSubsMessage);
  }

  async setupStateFromDatabase() {
    await ChoobQuoteModel.find({}).then((choobModels) => {
      if (choobModels != null) {
        choobModels.forEach(choob => {
          this._choobs.push(choob);
        });
      }
    }).catch(err => ChoobLogger.error(err))

    await TwitchEventMessageGiftedSubsModel.find({}).then((quoteModels) => {
      if (quoteModels != null) {
        quoteModels.forEach(quote => {
          this._giftedSubQuotes.push(quote);
        });
      }
    }).catch(err => ChoobLogger.error(err))

    ChoobQuoteModel.watch().on('change', (change) => this.onChoobMessageChange(change))
    TwitchChannelConfigModel.watch(undefined, { fullDocument: 'updateLookup' }).on('change', (change) => this.onTwitchChannelConfigChange(change))
    TwitchEventMessageGiftedSubsModel.watch().on('change', (change) => this.onTwitchGiftedSubMessageChange(change))
  }

  onChoobMessageChange(change: ChangeEvent<ChoobQuote>) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(`Deleted a choob: ${change.documentKey._id}`)
      const deletedChoob = this._choobs.findIndex((choob: ChoobQuote) => choob._id?.equals(change.documentKey._id))
      if (deletedChoob >= 0) {
        ChoobLogger.debug("Found the deleted choob in local array!")
        this._choobs.splice(deletedChoob, 1);
      }
    }
    else if (change.operationType === "insert") {
      ChoobLogger.debug(`Added a choob! ${change.documentKey._id}`)
      const insertedChoob = this._choobs.findIndex((choob: ChoobQuote) => choob._id?.equals(change.documentKey._id))
      if (insertedChoob < 0) {
        ChoobLogger.debug("Didn't find the added choob in local array!")
        this._choobs.push(change.fullDocument as DocumentType<ChoobQuote>);
      }
    }
    else if (change.operationType === "update") {
      ChoobLogger.debug(`Updated a choob!`)
      const updatedChoobIndex = this._choobs.findIndex((choob: ChoobQuote) => choob._id?.equals(change.documentKey._id))
      if (updatedChoobIndex >= 0) {
        ChoobLogger.debug("Found the updated choob in local array!")
        if (change.updateDescription.updatedFields.quote !== undefined) {
          this._choobs[updatedChoobIndex].quote = change.updateDescription.updatedFields.quote;
        }
      }
    }
  }

  onTwitchChannelConfigChange(change: ChangeEvent<any>) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(`Deleted a twitch channel config: ${change.documentKey._id}`)
      let deletedConfig = '';
      for (let [channelName, value] of this._twitchChannelConfigs.entries()) {
        if (value._id?.equals(change.documentKey._id as string)) {
          deletedConfig = channelName;
          break;
        }
      }
      if (deletedConfig !== '') {
        ChoobLogger.debug("Found the deleted channel config in local array!")
        this._twitchChannelConfigs.delete(deletedConfig);
      }
    }
    else if (change.operationType === "insert") {
      ChoobLogger.debug(`Added a twitch channel config! ${change.documentKey._id}`)
      if (!this._twitchChannelConfigs.has(change.fullDocument.channelName)) {
        ChoobLogger.debug("Didn't find the added channel in local array!")
        this._twitchChannelConfigs.set(change.fullDocument.channelName, change.fullDocument as DocumentType<TwitchChannelConfig>);
      }
    }
    else if (change.operationType === "update") {
      ChoobLogger.debug(`Updated a channel config!`)
      if (this._twitchChannelConfigs.has(change.fullDocument.channelName)) {
        ChoobLogger.debug("Found the added channel in local array!")
        this._twitchChannelConfigs.set(change.fullDocument.channelName, change.fullDocument as DocumentType<TwitchChannelConfig>);
      }
    }
  }

  onTwitchGiftedSubMessageChange(change: ChangeEvent<TwitchEventMessageGiftedSubs>) {
    if (change.operationType === "delete") {
      ChoobLogger.debug(`Deleted a gifted sub message: ${change.documentKey._id}`)
      const deletedMessage = this._giftedSubQuotes.findIndex((giftedMessage: TwitchEventMessageGiftedSubs) => giftedMessage._id?.equals(change.documentKey._id))
      if (deletedMessage >= 0) {
        ChoobLogger.debug("Found the deleted gifted sub message in local array!")
        this._giftedSubQuotes.splice(deletedMessage, 1);
      }
    }
    else if (change.operationType === "insert") {
      ChoobLogger.debug(`Added a gifted sub message! ${change.documentKey._id}`)
      const insertedMessage = this._giftedSubQuotes.findIndex((giftedMessage: TwitchEventMessageGiftedSubs) => giftedMessage._id?.equals(change.documentKey._id))
      if (insertedMessage < 0) {
        ChoobLogger.debug("Didn't find the added gifted sub message in local array!")
        this._giftedSubQuotes.push(change.fullDocument as DocumentType<TwitchEventMessageGiftedSubs>);
      }
    }
    else if (change.operationType === "update") {
      ChoobLogger.debug(`Updated a gifted sub message!`)
      const updatedMessageIndex = this._giftedSubQuotes.findIndex((giftedMessage: TwitchEventMessageGiftedSubs) => giftedMessage._id?.equals(change.documentKey._id))
      if (updatedMessageIndex >= 0) {
        ChoobLogger.debug("Found the updated gifted sub message in local array!")
        if (change.updateDescription.updatedFields.message !== undefined) {
          this._giftedSubQuotes[updatedMessageIndex].message = change.updateDescription.updatedFields.message;
        }
        if (change.updateDescription.updatedFields.minimumGifts !== undefined) {
          this._giftedSubQuotes[updatedMessageIndex].minimumGifts = change.updateDescription.updatedFields.minimumGifts;
        }
      }
    }
  }

}

export = new StateManager(undefined);