// https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate

import { TwitchChannelConfig, TwitchChannelConfigModel } from '../../../structures/databaseTypes/schemas/TwitchChannelConfig';
import { TCSEventGiftSubListeningModel, TCSEventGiftSubOptionsModel, TCSEventResubListeningModel } from '../../../structures/databaseTypes/schemas/TwitchChannelSettings';
import { ChoobLogger } from '../../../utils/ChoobLogger';
import StateManager from '../../../utils/StateManager';
import BaseEvent from '../../../structures/commands/BaseEvent';
import { TwitchManager } from '../../TwitchClientManager';

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
            setDefaultsOnInsert: true,
            useFindAndModify: false
          }
        ).then(async (config) => {
          this.logger.info(`Added config for ${channel} to database`)
          StateManager.emit('twitchChannelConfigFetched', config)



          let gift = await TCSEventGiftSubListeningModel.findOneAndUpdate({ channelId: user.id }, {}, { useFindAndModify: false, upsert: true, new: true, setDefaultsOnInsert: true })
          if (!gift) {
            gift = new TCSEventGiftSubListeningModel({ channelId: user.id })
            await gift.save();
            ChoobLogger.debug(`Generated new gift sub event settings for ${user.name}: ${user.id}`)
          }

          let giftOpts = await TCSEventGiftSubOptionsModel.findOneAndUpdate({ channelId: user.id }, {}, { useFindAndModify: false, upsert: true, new: true, setDefaultsOnInsert: true })
          if (!giftOpts) {
            giftOpts = new TCSEventGiftSubOptionsModel({ channelId: user.id })
            await giftOpts.save();
            ChoobLogger.debug(`Generated new gift sub event options settings for ${user.name}: ${user.id}`)
          }

          let resubListening = await TCSEventResubListeningModel.findOneAndUpdate({ channelId: user.id }, {}, { useFindAndModify: false, upsert: true, new: true, setDefaultsOnInsert: true })
          if (!resubListening) {
            resubListening = new TCSEventResubListeningModel({ channelId: user.id })
            await resubListening.save();
            ChoobLogger.debug(`Generated new gift sub event options settings for ${user.name}: ${user.id}`)
          }



        }).catch((err) => {
          this.logger.error(`Wrror while creating ${channel} config in database`, err)
        })
      }
    } else {



      const user = await client.api.helix.users.getUserByName(channel.slice(1));

      if (user) {
        let gift = await TCSEventGiftSubListeningModel.findOneAndUpdate({ channelId: user.id }, {}, { useFindAndModify: false, upsert: true, new: true, setDefaultsOnInsert: true })
        let giftOpts = await TCSEventGiftSubOptionsModel.findOneAndUpdate({ channelId: user.id }, {}, { useFindAndModify: false, upsert: true, new: true, setDefaultsOnInsert: true })
        let resubListening = await TCSEventResubListeningModel.findOneAndUpdate({ channelId: user.id }, { isListening: false }, { useFindAndModify: false, upsert: true, new: true, setDefaultsOnInsert: true })


      }

    }


  }

}