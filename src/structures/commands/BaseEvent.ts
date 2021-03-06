import { ChoobLogger } from "../../utils/ChoobLogger";
import { TwitchManager } from "../../twitch/TwitchClientManager";

export default abstract class BaseEvent {

  constructor(private name: string) { }

  getName(): string { return this.name; }
  abstract run(client: TwitchManager, ...args: any): void;
}
