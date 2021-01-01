import { ChoobLogger } from "../Logging";
import { TwitchManager } from "../TwitchClientManager";

export default abstract class BaseEvent {
  logger = ChoobLogger;

  constructor(private name: string) { }

  getName(): string { return this.name; }
  abstract run(client: TwitchManager, ...args: any): void;
}
