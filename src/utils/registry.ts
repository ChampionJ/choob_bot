import path from "path";
import { promises as fs } from "fs";
import { TwitchManager } from "../twitch/TwitchClientManager";
import BaseEvent from "../structures/commands/BaseEvent";
import {
  DiscordGlobalSimpleCommandModel,
  TwitchGlobalSimpleCommandModel,
} from "../structures/databaseTypes/schemas/SimpleCommand";
import { ChoobLogger } from "./ChoobLogger";
import { IClientManager } from "../structures/databaseTypes/interfaces/IClientManager";
import { DiscordManager } from "../discord/DiscordClientManager";

export async function registerCommands(
  client: IClientManager,
  dir: string = ""
) {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerCommands(client, path.join(dir, file));
    if (file.endsWith(".js") || file.endsWith(".ts")) {
      const { default: Command } = await import(path.join(dir, file));
      const command = new Command();
      client.addCommand(command);
    }
  }
}
export async function registerDatabaseCommands(client: TwitchManager) {
  //* We're only grabbing global commands that are stored in the database, as they'll be saved in-memory
  await TwitchGlobalSimpleCommandModel.find({})
    .then((commandModels) => {
      if (commandModels != null) {
        ChoobLogger.debug(
          `Fetched command models. Got ${commandModels.length}`
        );
        commandModels.forEach((commandModel) => {
          client.addSimpleCommand(commandModel);
        });
      }
    })
    .catch((err) => ChoobLogger.error(err, err));
}

export async function registerDiscordDatabaseCommands(client: DiscordManager) {
  //* We're only grabbing global commands that are stored in the database, as they'll be saved in-memory
  await DiscordGlobalSimpleCommandModel.find({})
    .then((commandModels) => {
      if (commandModels != null) {
        ChoobLogger.debug(
          `Fetched command models. Got ${commandModels.length}`
        );
        commandModels.forEach((commandModel) => {
          client.addSimpleCommand(commandModel);
        });
      }
    })
    .catch((err) => ChoobLogger.error(err, err));
}

export async function registerEvents(client: IClientManager, dir: string = "") {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerEvents(client, path.join(dir, file));
    if (file.endsWith(".js") || file.endsWith(".ts")) {
      const { default: Event } = await import(path.join(dir, file));
      const event = new Event();
      ChoobLogger.info(`Initialized the ${event.getName()} event!`);
      client.addEvent(event);
    }
  }
}

// export async function registerDiscordEvents(
//   client: IClientManager,
//   dir: string = ""
// ) {
//   const filePath = path.join(__dirname, dir);
//   const files = await fs.readdir(filePath);
//   for (const file of files) {
//     const stat = await fs.lstat(path.join(filePath, file));
//     if (stat.isDirectory()) registerDiscordEvents(client, path.join(dir, file));
//     if (file.endsWith(".js") || file.endsWith(".ts")) {
//       const { default: Event } = await import(path.join(dir, file));
//       const event = new Event();
//       client.baseEvents.set(event.getName(), event);
//       client.on(event.getName(), event.run.bind(event, client));
//     }
//   }
// }
