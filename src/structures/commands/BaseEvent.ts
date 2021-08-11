import { ChoobLogger } from "../../utils/ChoobLogger";
import { TwitchManager } from "../../twitch/TwitchClientManager";
import { IClientManager } from "../databaseTypes/interfaces/IClientManager";

export default abstract class BaseEvent {
  constructor(private name: string) {}

  getName(): string {
    return this.name;
  }
  abstract run(client: IClientManager, ...args: any): void;
}
