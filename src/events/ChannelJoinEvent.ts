// https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate

import { TwitchChannelConfig, TwitchChannelConfigModel } from '../database/schemas/TwitchChannelConfig';
import { TCSEventGiftSubListeningModel } from '../database/schemas/TwitchChannelSettings';
import StateManager from '../utils/StateManager';
import BaseEvent from '../utils/structures/BaseEvent';
import { TwitchManager } from '../utils/TwitchClientManager';

export default class ChannelJoinEvent extends BaseEvent {
  constructor() {
    super('onJoin');
  }

  async run(client: TwitchManager, channel: string) {

    this.logger.info(`Joined ${channel}`)
    // Check to see if we have the channel in our local copy of configs, if not, add it. 
    if (!StateManager.twitchChannelConfigs.has(channel)) {

      const user = await client.api.helix.users.getUserByName(channel.slice(1));
      if (user) {

        // TODO this should probably be a find and then a update if botIsInChannel is false (or doc doesnt exist)
        await TwitchChannelConfigModel.findOneAndUpdate(
          {
            identifier: user?.id
          },
          {
            botIsInChannel: true,
            channelName: channel
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        ).then((config) => {
          this.logger.info(`Added config for ${channel} to database`)
          StateManager.emit('twitchChannelConfigFetched', config)

        }).catch((err) => {
          this.logger.error(`Wrror while creating ${channel} config in database`, err)
        })
      }
    }
  }

}