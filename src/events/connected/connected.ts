import { TwitchManager } from "../../types";
import StateManager from "../../utils/StateManager";
import BaseEvent from "../../utils/structures/BaseEvent";

export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('onConnect');
    StateManager.emit('ready');
  }
  async run(client: TwitchManager) {
    this.logger.info("Choob_Bot has connected to Twitch!")
  }
}