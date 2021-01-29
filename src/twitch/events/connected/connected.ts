import StateManager from "../../../utils/StateManager";
import BaseEvent from "../../../structures/commands/BaseEvent";
import { TwitchManager } from "../../TwitchClientManager";

export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('onConnect');
    StateManager.emit('ready');
  }
  async run(client: TwitchManager) {
    this.logger.info("Choob_Bot has connected to Twitch!")
  }
}