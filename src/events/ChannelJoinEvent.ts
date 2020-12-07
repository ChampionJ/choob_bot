// https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate

import { TwitchChannelConfigModel } from '../database/schemas/TwitchChannelConfig';
import { TwitchManager } from '../types';
import StateManager from '../utils/StateManager';
import BaseEvent from '../utils/structures/BaseEvent';

export default class ChannelJoinEvent extends BaseEvent {
  constructor() {
    super('onJoin');
  }

  async run(client: TwitchManager, channel: string) {

    this.logger.info(`Joined ${channel}`)
    await TwitchChannelConfigModel.create({
      channelName: channel
    }).then(() => {
      this.logger.info(`Added config for ${channel} to database`)
    }).catch((err) => {
      if (err.code !== 11000)
        this.logger.error(`Non-Duplicate error while creating ${channel} config in database`, err)
    })

    await TwitchChannelConfigModel.findOne({ channelName: channel }).then((config) => {
      if (config != null) {
        StateManager.emit('twitchChannelConfigFetched', channel, config)
      }
    }).catch(err => this.logger.error(err))
  }
}