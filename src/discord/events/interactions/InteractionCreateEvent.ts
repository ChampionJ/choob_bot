import { Interaction, Message } from "discord.js";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";
import { DiscordUserModel } from "../../../structures/databaseTypes/schemas/TwitchUsers";
import { ChoobLogger } from "../../../utils/ChoobLogger";
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

    if (command) {
      const commandChoobUserPermissionLevelRequired =
        command.getChoobRoleRequired();
      ChoobLogger.debug("triggered: " + command.getName());

      if (commandChoobUserPermissionLevelRequired !== undefined) {
        ChoobLogger.debug(
          `checking permissions for ${interaction.user.username}...`
        );
        await DiscordUserModel.findOne({ username: interaction.user.username })
          .then((discordUserData) => {
            if (discordUserData) {
              if (discordUserData.roles) {
                if (
                  discordUserData.roles?.includes(
                    commandChoobUserPermissionLevelRequired
                  ) ||
                  discordUserData.roles?.includes(ChoobRole.ADMIN)
                ) {
                  ChoobLogger.debug(
                    `${discordUserData} has required permission level!`
                  );
                  command.runInteraction(client, interaction);
                } else {
                  ChoobLogger.debug(
                    `${interaction.user.username} lacked proper role`
                  );
                  return;
                }
              } else {
                ChoobLogger.debug(
                  `${interaction.user.username} roles undefined`
                );
                return;
              }
            } else {
              ChoobLogger.debug(
                `${interaction.user.username} was not found in the database`
              );
              return;
            }
          })
          .catch((err) => {
            ChoobLogger.error("Error fetching permissions", err);
            return;
          });
      } else {
        command.runInteraction(client, interaction);
      }
    }
  }
}
