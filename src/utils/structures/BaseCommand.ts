
import { TwitchManager, TwitchMessage } from "../../types";


export default abstract class BaseCommand {
  constructor(private name: string, private category: string, private aliases: Array<string>) { }

  getName(): string { return this.name; }
  getCategory(): string { return this.category; }
  getAliases(): Array<string> { return this.aliases; }

  abstract run(client: TwitchManager, message: TwitchMessage, args: Array<string> | null): Promise<void>;
}