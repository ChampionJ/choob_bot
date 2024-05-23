import {
  ChannelType,
  Message,
  PermissionFlagsBits,
  Permissions,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";
import { DiscordUserModel } from "../../../structures/databaseTypes/schemas/TwitchUsers";
import { ChoobLogger } from "../../../utils/ChoobLogger";
import { fetchAllReactions, setRoleForUsers } from "../../../utils/utils";
import { DiscordManager } from "../../DiscordClientManager";
export default class MessageEvent extends BaseEvent {
  constructor() {
    super("messageCreate");
  }
  async run(client: DiscordManager, message: Message) {
    if (message.author.bot) return;
    // ChoobLogger.info(`Message: \n${message}`);

    if (message.channel.type === ChannelType.GuildAnnouncement) {
      if (message.author.id === "282286160494067712") {
        const permissions = new PermissionsBitField([
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageMessages,
          PermissionsBitField.Flags.MentionEveryone,
        ]);
        if (
          message.channel
            .permissionsFor(message.guild?.members.me!)
            .has(permissions)
        ) {
          message
            .crosspost()
            .then(() => ChoobLogger.debug("Crossposted message"))
            .catch(console.error);
        } else {
          ChoobLogger.debug("Did not have proper permissions to publish");
        }
      }
    }

    return;

    /*
    if (message.content.startsWith("!")) {
      const [cmdName, ...cmdArgs] = message.content
        .slice(1)
        .trim()
        .split(/\\s+/);
      const command = await client.tryGetCommand(
        message.guildId!,
        cmdName.toLowerCase().replace(/-/g, "")
      );

      if (command) {
        const commandGuildPermissionRequired =
          command.getGuildPermissionRequired();
        const commandChoobUserPermissionLevelRequired =
          command.getChoobRoleRequired();
        const commandRolesRequired = command.getRoleRequired();
        ChoobLogger.debug("triggered: " + command.getName());

        if (commandChoobUserPermissionLevelRequired !== undefined) {
          ChoobLogger.debug(
            `checking permissions for ${message.author.username}...`
          );
          await DiscordUserModel.findOne({ username: message.author.username })
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
                  } else {
                    ChoobLogger.debug(
                      `${message.author.username} lacked proper role`
                    );
                    return;
                  }
                } else {
                  ChoobLogger.debug(
                    `${message.author.username} roles undefined`
                  );
                  return;
                }
              } else {
                ChoobLogger.debug(
                  `${message.author.username} was not found in the database`
                );
                return;
              }
            })
            .catch((err) => {
              ChoobLogger.error("Error fetching permissions", err);
              return;
            });
        }
        if (
          commandRolesRequired !== undefined ||
          commandGuildPermissionRequired !== undefined
        ) {
          if (commandGuildPermissionRequired !== undefined) {
            if (
              message.member?.permissions.has(
                commandGuildPermissionRequired,
                true
              )
            ) {
              command.run(client, message, cmdArgs);
              return;
            } else {
              ChoobLogger.debug(
                `${message.author.username} lacked proper guild permission`
              );
            }
          }
          if (commandRolesRequired !== undefined) {
            if (message.member?.roles.cache.hasAny(...commandRolesRequired)) {
              command.run(client, message, cmdArgs);
            } else {
              ChoobLogger.debug(
                `${message.author.username} lacked proper guild role`
              );
            }
          }
        } else {
          command.run(client, message, cmdArgs);
        }
      }
    }
    */
  }
}
