import path from "path";
import { promises as fs } from 'fs';
import { TwitchManager } from "./TwitchClientManager";
import BaseEvent from "./structures/BaseEvent";
import { CustomCommandModel } from "../database/schemas/SimpleCommand";
import BaseSimpleCommand from "./structures/BaseSimpleCommand";

export async function registerCommands(client: TwitchManager, dir: string = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerCommands(client, path.join(dir, file));
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const { default: Command } = await import(path.join(dir, file));
      const command = new Command();
      client.addCommand(command);
    }
  }

  await CustomCommandModel.find({}).then((commandModels) => {
    if (commandModels != null) {
      commandModels.forEach(commandModel => {
        //const simpleCommand = new BaseSimpleCommand(commandModel.commandName!, commandModel.commandResponse!, commandModel.commandAliases!, commandModel.replyInDM)
        client.addSimpleCommand(commandModel);
      });
    }
  }).catch(err => client.logger.error(err, err))
}

export async function registerEvents(client: TwitchManager, dir: string = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerEvents(client, path.join(dir, file));
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const { default: Event } = await import(path.join(dir, file));
      const event: BaseEvent = new Event();
      event.logger.info(`Initialized the ${event.getName()} event!`)
      client[event.getName()](event.run.bind(event, client))
    }
  }
}