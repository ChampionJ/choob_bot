import winston from "winston";
import { TwitchManager } from "../../types";
import BaseEvent from "../../utils/structures/BaseEvent";

const logger = winston.loggers.get('main');

export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('connected');
  }
  async run(client: TwitchManager) {
    logger.info("Choob_Bot has connected to Twitch!")

  }
}