import { TwitchManager } from "../../types";
import BaseEvent from "../../utils/structures/BaseEvent";

export default class ConnectedEvent extends BaseEvent {
  constructor() {
    super('connected');
  }
  async run(client: TwitchManager) {
    console.log('Bot has logged in.');
  }
}