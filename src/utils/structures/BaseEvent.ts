import winston from "winston";
import { TwitchManager } from "../TwitchClientManager";

export default abstract class BaseEvent {
  logger = winston.loggers.get('main');

  constructor(private name: string) { }

  getName(): string { return this.name; }
  abstract run(client: TwitchManager, ...args: any): void;
}
