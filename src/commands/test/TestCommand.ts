import { TwitchManager, TwitchMessage } from "../../types";
import BaseCommand from "../../utils/structures/BaseCommand";

export default class TestCommand extends BaseCommand {
  constructor() {
    super('test', 'testing', []);
  }

  async run(client: TwitchManager, message: TwitchMessage, args: Array<string>) {
    client.client.say(message.target, 'Test command works');
  }
}