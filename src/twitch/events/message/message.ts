import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { TwitchChannelConfigModel } from "../../../structures/databaseTypes/schemas/TwitchChannelConfig";
import { TwitchUserModel } from "../../../structures/databaseTypes/schemas/TwitchUsers";
import StateManager from "../../../utils/StateManager";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { TwitchManager } from "../../TwitchClientManager";
import { ChannelPermissionLevel } from "../../../structures/databaseTypes/interfaces/ICommand";
import { ChoobRole } from "../../../structures/databaseTypes/interfaces/IUser";

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('onMessage');

    StateManager.on('twitchChannelConfigFetched', (config) => {
      this.logger.debug(`Fetched prefix for ${config.channelName}: "${config.prefix}"`)
    })
  }

  async run(client: TwitchManager, targetChannel: string, user: string, message: string, msgRaw: TwitchPrivateMessage): Promise<void> {

    this.logger.debug(`${targetChannel} | ${user}: ${message}`)
    const prefix = StateManager.twitchChannelConfigs.get(targetChannel)?.prefix || '!';

    if (message.startsWith(prefix)) {
      const [cmdName, ...cmdArgs] = message
        .slice(prefix.length)
        .trim()
        .split(/\s+/);

      const command = await client.tryGetCommand(msgRaw.channelId!, cmdName.toLowerCase().replace(/-/g, ""));

      if (command) {
        const commandGeneralUserPermissionRequired = command.getCategory();
        const commandChoobUserPermissionLevelRequired = command.getRoleRequired();
        this.logger.debug('triggered: ' + command.getName())

        if (commandChoobUserPermissionLevelRequired !== undefined) {
          this.logger.debug(`checking permissions for ${user}...`)
          await TwitchUserModel.findOne({ username: user }).then((twitchUserData) => {
            if (twitchUserData) {
              if (twitchUserData.roles) {
                if (twitchUserData.roles?.includes(commandChoobUserPermissionLevelRequired) || twitchUserData.roles?.includes(ChoobRole.ADMIN)) {
                  this.logger.debug(`${user} has required permission level!`)
                  command.run(client, targetChannel, msgRaw, cmdArgs);
                } else {
                  this.logger.debug(`${user} lacked proper role`)
                }
              } else {
                this.logger.debug(`${user} roles undefined`)
              }
            } else {
              this.logger.debug(`${user} was not found in the database`)
            }
          }).catch(err => this.logger.error('Error fetching permissions', err))
        } else {
          if (commandGeneralUserPermissionRequired === ChannelPermissionLevel.BROADCASTER) {
            if (msgRaw.userInfo.isBroadcaster) {
              command.run(client, targetChannel, msgRaw, cmdArgs);
            }
          }
          else if (commandGeneralUserPermissionRequired === ChannelPermissionLevel.MODERATOR) {
            if (msgRaw.userInfo.isMod || msgRaw.userInfo.isBroadcaster) {
              command.run(client, targetChannel, msgRaw, cmdArgs);
            }
          } else if (commandGeneralUserPermissionRequired === ChannelPermissionLevel.CHOOB_CHANNEL) {
            if (targetChannel === '#choob_bot') {
              command.run(client, targetChannel, msgRaw, cmdArgs);
            }
          } else {
            command.run(client, targetChannel, msgRaw, cmdArgs);
          }
        }
      }
    }
  }
}


