import { mongoose, DocumentType, getClass } from "@typegoose/typegoose";
import { EventEmitter } from "events";
import { connect, connection } from "mongoose";
import winston from "winston";
import { TwitchChannelConfig, TwitchChannelConfigModel } from '../database/schemas/TwitchChannelConfig';
import { TwitchGiftedSubsMessage } from "../database/schemas/TwitchGiftedSubsMessage";

const logger = winston.loggers.get('main');

interface StateManager {
  on(event: 'twitchChannelConfigFetched', listener: (channel: string, config: TwitchChannelConfig) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'setupDatabaseManually', listener: () => void): this;
  on(event: 'twitchGiftedSubsMessageFetched', listener: (giftedSubsMessage: TwitchGiftedSubsMessage) => void): this;
}

class StateManager extends EventEmitter {
  connection: import("mongoose").Connection;
  twitchChannelConfigs: Map<string, TwitchChannelConfig>;

  constructor(options: any) {
    super(options);
    this.connection = connection
    this.twitchChannelConfigs = new Map();
    this.on('twitchChannelConfigFetched', this.channelFetched)
    this.on('twitchGiftedSubsMessageFetched', this.giftedSubMessageFetched)
    connect(process.env.DATABASE!, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
  }
  channelFetched(channel: string, config: TwitchChannelConfig) {
    logger.info(`Fetched config for ${channel}`, config)
    this.twitchChannelConfigs.set(channel, config)
  };
  giftedSubMessageFetched(giftedSubsMessage: TwitchGiftedSubsMessage) {

  }

  // StateManager.on('twitchChannelConfigFetched', (channel, config) => {
  //   console.log(`Fetched prefix for ${channel}: \"${config.prefix}\"`)
  //   twitchChannelCommandPrefixes.set(channel, config.prefix)
  // })
}



export = new StateManager(undefined);