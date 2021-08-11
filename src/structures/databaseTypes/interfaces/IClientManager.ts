import { Collection } from "discord.js";
import {
  EventEmitter,
  EventBinder,
  EventHandler,
} from "@d-fischer/typed-event-emitter";
import { BaseTwitchCommand, IBaseCommand } from "../../commands/BaseCommand";
import BaseEvent from "../../commands/BaseEvent";
// import { EventEmitter } from 'typed-event-emitter';

export interface IClientManager {
  addCommand(command: IBaseCommand): void;
  addEvent(event: BaseEvent): void;
}
