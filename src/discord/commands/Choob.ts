import {
  ApplicationCommandData,
  CommandInteraction,
  EmbedBuilder,
  Message,
  SlashCommandBuilder,
} from "discord.js";
import { BaseDiscordCommand } from "../../structures/commands/BaseCommand";
import { ChoobLogger } from "../../utils/ChoobLogger";
import StateManager from "../../utils/StateManager";
import { DiscordManager } from "../DiscordClientManager";

export default class ChoobCommand extends BaseDiscordCommand {
  constructor() {
    super("choob", "Say a choob quote!", undefined, undefined, undefined, []);
  }
  getSlashCommand() {
    return new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(this.getDescription());
  }
  getApplicationCommand(): ApplicationCommandData {
    return { description: this.getDescription(), name: this.getName() };
  }
  async runInteraction(
    client: DiscordManager,
    interaction: CommandInteraction
  ) {
    const choobIndexCount = StateManager.choobs.length;
    const choobQuote =
      StateManager.choobs[Math.floor(Math.random() * choobIndexCount)];
    await interaction.reply({
      content: choobQuote!.quote!.replace("{user}", interaction.user.username),
      ephemeral: false,
    });
  }
  async run(client: DiscordManager, message: Message, args: Array<string>) {
    const choobIndexCount = StateManager.choobs.length;
    const choobQuote =
      StateManager.choobs[Math.floor(Math.random() * choobIndexCount)];

    if (choobQuote) {
      const embed = new EmbedBuilder()
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
