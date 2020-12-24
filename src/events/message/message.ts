import { TwitchPrivateMessage } from "twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage";
import { TwitchChannelConfigModel } from "../../database/schemas/TwitchChannelConfig";
import { TwitchUserModel } from "../../database/schemas/TwitchUsers";
import StateManager from "../../utils/StateManager";
import BaseEvent from "../../utils/structures/BaseEvent";
import { TwitchManager } from "../../utils/TwitchClientManager";

export default class MessageEvent extends BaseEvent {
  constructor() {
    super('onMessage');

    StateManager.on('twitchChannelConfigFetched', (config) => {
      this.logger.debug(`Fetched prefix for ${config.channelName}: \"${config.prefix}\"`)
      //twitchChannelCommandPrefixes.set(config.channelName, config.prefix)
    })
  }

  async run(client: TwitchManager, targetChannel: string, user: string, message: string, msgRaw: TwitchPrivateMessage) {

    this.logger.debug(`${targetChannel} | ${user}: ${message}`)
    const prefix = StateManager.twitchChannelConfigs.get(targetChannel)?.prefix! || '!';

    if (message.startsWith(prefix)) {
      const [cmdName, ...cmdArgs] = message
        .slice(prefix.length)
        .trim()
        .split(/\s+/);
      const commandName = client.commandAliases.get(cmdName.toLowerCase().replace(/-/g, ""));

      if (commandName) {
        const command = client.commands.get(commandName);
        if (command) {
          const commandCategory = command.getCategory();
          const commandPermissionLevel = command.getPermissionLevel();
          this.logger.debug('triggered: ' + command.getName())

          if (commandPermissionLevel > 0) {
            this.logger.debug(`checking permissions for ${user}...`)
            await TwitchUserModel.findOne({ username: user }).then((twitchUserData) => {
              // this.logger.debug('Admin command check', config)
              if (twitchUserData) {
                if (twitchUserData!.permissionLevel! >= commandPermissionLevel) {
                  this.logger.debug(`${user} has required permission level!`)
                  command.run(client, targetChannel, msgRaw, cmdArgs);
                }
              } else {
                // TODO: check if they're a mod of an approved channel, and then add them to the user database?
              }
            }).catch(err => this.logger.error('Error fetching permissions', err))
          } else {
            if (commandCategory === 'channelBroadcaster') {
              if (msgRaw.userInfo.isBroadcaster) {
                command.run(client, targetChannel, msgRaw, cmdArgs);
              }
            }
            else if (commandCategory === 'moderator') {
              if (msgRaw.userInfo.isMod || msgRaw.userInfo.isBroadcaster) {
                command.run(client, targetChannel, msgRaw, cmdArgs);
              }
            } else if (commandCategory === 'choobChannelOnly') {
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
}


