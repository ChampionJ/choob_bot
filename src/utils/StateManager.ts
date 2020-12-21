import { mongoose, DocumentType, getClass } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import winston from "winston";
import { ChoobMessage, ChoobMessageModel } from "../database/schemas/ChoobMessage";
import { TwitchChannelConfig, TwitchChannelConfigModel } from '../database/schemas/TwitchChannelConfig';
import { TwitchGiftedSubsMessage } from "../database/schemas/TwitchGiftedSubsMessage";

const logger = winston.loggers.get('main');

interface StateManager {
  on(event: 'twitchChannelConfigFetched', listener: (config: TwitchChannelConfig) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'choobFetched', listener: (choobMessage: ChoobMessage) => void): this;
  on(event: 'choobRemoved', listener: (index: number) => void): this;
  on(event: 'setupDatabaseManually', listener: () => void): this;
  on(event: 'twitchGiftedSubsMessageFetched', listener: (giftedSubsMessage: TwitchGiftedSubsMessage) => void): this;
}

class StateManager extends EventEmitter {
  connection: import("mongoose").Connection;
  twitchChannelConfigs: Map<string, TwitchChannelConfig>;
  choobs: ChoobMessage[];

  constructor(options: any) {
    super(options);
    this.connection = connection
    this.twitchChannelConfigs = new Map();
    this.choobs = [];
    this.on('twitchChannelConfigFetched', this.channelFetched)
    this.on('choobFetched', this.choobFetched)
    this.on('choobRemoved', this.choobRemoved)
    this.on('twitchGiftedSubsMessageFetched', this.giftedSubMessageFetched)
    connect(process.env.DATABASE!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    this.setupStateFromDatabase();
  }
  channelFetched(config: TwitchChannelConfig) {
    logger.info(`Fetched config for ${config.channelName}`);
    this.twitchChannelConfigs.set(config.channelName!, config);
  };
  choobFetched(choobMessage: ChoobMessage) {
    logger.info(`Fetched choob ${choobMessage.message}`);
    this.choobs.push(choobMessage);
  };
  choobRemoved(choobIndex: number) {
    logger.info(`Removed choob ${this.choobs[choobIndex].message}`);
    this.choobs.splice(choobIndex, 1);
  };
  giftedSubMessageFetched(giftedSubsMessage: TwitchGiftedSubsMessage) {

  }

  // StateManager.on('twitchChannelConfigFetched', (channel, config) => {
  //   console.log(`Fetched prefix for ${channel}: \"${config.prefix}\"`)
  //   twitchChannelCommandPrefixes.set(channel, config.prefix)
  // })
  async setupStateFromDatabase() {
    await ChoobMessageModel.find({}).then((choobModels) => {
      if (choobModels != null) {
        choobModels.forEach(choob => {
          this.choobs.push(choob);
        });
      }
    }).catch(err => logger.error(err))
  }
}



export = new StateManager(undefined);