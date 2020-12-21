import { PrivateMessage } from "twitch-chat-client/lib";
import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { TwitchManager, TwitchMessage } from "../../types";
import BaseCommand from "../../utils/structures/BaseCommand";

export default class TestCommand extends BaseCommand {
  constructor() {
    super('test', 'testing', 0, []);
  }

  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>) {
    client.say(targetChannel, 'Test command works');
  }
}