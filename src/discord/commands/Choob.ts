import { Message, MessageEmbed } from "discord.js";
import { BaseDiscordCommand } from "../../structures/commands/BaseCommand";
import { ChoobLogger } from "../../utils/ChoobLogger";
import StateManager from "../../utils/StateManager";
import { DiscordManager } from "../DiscordClientManager";

export default class ChoobCommand extends BaseDiscordCommand {
  constructor() {
    super("choob", undefined, undefined, undefined, []);
  }
  async run(client: DiscordManager, message: Message, args: Array<string>) {
    const choobIndexCount = StateManager.choobs.length;
    const choobQuote =
      StateManager.choobs[Math.floor(Math.random() * choobIndexCount)];

    if (choobQuote) {
      const embed = new MessageEmbed()
        .setColor(0xffffff)
        .setDescription(
          choobQuote!.quote!.replace("{user}", message.member?.displayName!)
        );
      message.channel.send({ embeds: [embed] });
      // message.reply({ embeds: [embed] });

      ChoobLogger.verbose(
        `${message.author.username} executed ${this.getName()} command in ${
          message.channelId
        }`
      );
    } else {
      ChoobLogger.error(`Attempted ChoobMessage fetch returned no results!`);
    }
  }
}
