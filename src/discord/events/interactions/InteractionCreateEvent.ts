import { Interaction, Message } from "discord.js";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { DiscordManager } from "../../DiscordClientManager";

export default class MessageEvent extends BaseEvent {
  constructor() {
    super("interactionCreate");
  }
  async run(client: DiscordManager, interaction: Interaction) {
    if (!interaction.isCommand()) {
      return;
    }
    const command = await client.tryGetCommand(
      interaction.guildId!,
      interaction.commandName
    );
    if (command === undefined) {
      return;
    }
    command.runInteraction(client, interaction);
  }
}
