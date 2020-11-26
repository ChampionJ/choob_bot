// https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate

import { RoomState } from 'tmi.js';
import TwitchChannelConfig from '../database/schemas/ChannelConfig';
import { TwitchManager } from '../types';
import BaseEvent from '../utils/structures/BaseEvent';



export default class ChannelJoinEvent extends BaseEvent {
  constructor() {
    super('roomstate');
  }

  async run(client: TwitchManager, channel: string, state: RoomState) {

    this.logger.info(`Joined ${channel}`)
    await TwitchChannelConfig.create({
      channelName: channel
    }).then(() => {
      this.logger.info(`Added config for ${channel} to database`)
    }).catch((err) => {
      if (err.code !== 11000)
        this.logger.error(`Non-Duplicate error while creating ${channel} config in database`, err)
    })


  }
}