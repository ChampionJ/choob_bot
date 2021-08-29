import BaseEvent from "../../../structures/commands/BaseEvent";
import { DiscordGuildConfigModel } from "../../../structures/databaseTypes/schemas/DiscordGuildConfig";
import { ChoobLogger } from "../../../utils/ChoobLogger";
import StateManager from "../../../utils/StateManager";
import { DiscordManager } from "../../DiscordClientManager";

export default class ReadyEvent extends BaseEvent {
  constructor() {
    super("ready");
  }
  async run(client: DiscordManager) {
    ChoobLogger.info(
      "Connected to Discord as " +
        client.user?.tag +
        " - (" +
        client.user?.id +
        ")"
    );

    (await client.guilds.fetch()).each(async (guild) => {
      guild.id;

      // Check to see if we have the channel in our local copy of configs, if not, add it.
      if (!StateManager.discordGuildConfigs.has(guild.id)) {
        // TODO this should probably be a find and then a update if botIsInChannel is false (or doc doesnt exist)
        await DiscordGuildConfigModel.findOneAndUpdate(
          {
            guildId: guild.id,
          },
          {
            botIsInGuild: true,
            guildName: guild.name,
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            useFindAndModify: false,
          }
        )
          .then(async (config) => {
            ChoobLogger.info(
              `Updated config for ${config.guildName} in database`
            );
            StateManager.emit("discordGuildConfigFetched", config);
          })
          .catch((err) => {
            ChoobLogger.error(
              `Error while creating ${guild.name} config in database`,
              err
            );
          });
      } else {
        //grab event settings to listen to?
      }
    });
    await client.updateRestCommands();
  }
}
