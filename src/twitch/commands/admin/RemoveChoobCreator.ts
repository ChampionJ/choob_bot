
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage';
import { TwitchManager } from "../../TwitchClientManager";
import StateManager from '../../../utils/StateManager';
import BaseCommand from '../../../structures/commands/BaseCommand';
import { TwitchUserModel } from '../../../structures/databaseTypes/schemas/TwitchUsers';
import { ChoobLogger } from '../../../utils/ChoobLogger';
import { ChannelPermissionLevel } from '../../../structures/databaseTypes/interfaces/ICommand';
import { ChoobRole } from '../../../structures/databaseTypes/interfaces/IUser';



export default class RemoveChoobManagerCommand extends BaseCommand {
  constructor() {
    super('removechoobmanager', ChannelPermissionLevel.GENERAL, ChoobRole.ADMIN, []);
  }
  async run(client: TwitchManager, targetChannel: string, message: TwitchPrivateMessage, args: Array<string>): Promise<void> {

    this.logger.debug('Triggered addchoobmanager command');
    if (args.length > 0) {
      const user = await client.api.helix.users.getUserByName(args[0].toLowerCase())
        .catch((err) => {
          ChoobLogger.error(err)
        })
      if (user) {
        const model = await TwitchUserModel.findOne({ identifier: user.id });
        if (!model) {
          client.sendMsg(message.channelId!, targetChannel, `@${message.userInfo.displayName} couldn't find choob user: ${args[0]}`);
          return;
        }
        const res = await model.removeRolesAndSave([ChoobRole.ADDCHOOB, ChoobRole.REMOVECHOOB]);
        if (res) {
          if (res?.rolesChanged > 0) {
            client.sendMsg(message.channelId!, targetChannel, `@${user.displayName} can no longer manage choobs!`);
            ChoobLogger.info(`${message.userInfo.displayName} removed choob manager ${user.displayName}.`)
          } else {
            client.sendMsg(message.channelId!, targetChannel, `@${user.displayName} could not manage choobs.`);
          }
        } else {
          client.sendMsg(message.channelId!, targetChannel, `@${message.userInfo.displayName} something went wrong with the request.`);
        }
      } else {
        client.sendMsg(message.channelId!, targetChannel, `@${message.userInfo.displayName} couldn't find user: ${args[0]}`);
        return
      }
    } else {
      client.sendMsg(message.channelId!, targetChannel, `@${message.userInfo.displayName} please provide a username!`);
      return;
    }
  }
}
