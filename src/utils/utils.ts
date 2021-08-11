import {
  Collection,
  Guild,
  Message,
  MessageReaction,
  Role,
  User,
} from "discord.js";
import { ChoobLogger } from "./ChoobLogger";

export async function fetchAllReactions(
  message: Message,
  reaction: String,
  options = { botOnly: false, userOnly: false }
) {
  if (!(message instanceof Message))
    throw new Error(
      "discord-fetch-all: channel parameter is not a instance of a discord channel."
    );
  if (typeof reaction !== "string")
    throw new Error("discord-fetch-all: reaction parameter is not a string.");
  const { userOnly, botOnly } = options;
  let users: User[] = [];
  let lastID = "";

  while (true) {
    let fetchedUsers: (MessageReaction | undefined) | Collection<string, User> =
      lastID !== ""
        ? await message.reactions.cache.get(reaction)
        : await message.reactions.cache.get(reaction);

    if (!fetchedUsers) return [];

    fetchedUsers =
      lastID !== ""
        ? await fetchedUsers.users.fetch({ limit: 100, after: lastID })
        : await fetchedUsers.users.fetch({ limit: 100 });

    if (fetchedUsers.size === 0) {
      if (userOnly) users = users.filter((user) => !user.bot);
      if (botOnly) users = users.filter((user) => user.bot);
      return users;
    } else {
      fetchedUsers.forEach((u) => users.push(u));
      lastID = users[users.length - 1].id;
    }
  }
}

export async function setRoleForUsers(
  guild: Guild,
  usersArray: User[],
  roleToSet: Role
) {
  //? We can do 50 requests per second, so let's do one batch of 20 role checks then sleep for a second. This should let us do 1200 checks per minute.

  const maxPerBatch = 20;
  let results = {
    successful: 0,
    total: usersArray.length,
    skipped: 0,
    leftServer: 0,
  };
  //let successful = 0;
  for (let i = 0; i < usersArray.length; i++) {
    //guild.member(usersArray[i]);
    const member = await guild.members.fetch(usersArray[i]).catch((err) => {
      ChoobLogger.error(err);
    });
    if (member) {
      if (!member.roles.cache.some((role) => role === roleToSet)) {
        await member.roles.add(roleToSet).catch((err) => {
          ChoobLogger.error(err);
          results.leftServer++;
        });
        ChoobLogger.debug(`set role for ${member.displayName}`);
        results.successful++;
      } else {
        ChoobLogger.debug(`role already held by ${member.displayName}`);
        results.skipped++;
      }
    } else {
      ChoobLogger.debug(`no member found for ${usersArray[i].username}`);
      results.leftServer++;
    }
    // await guild.member(usersArray[i])?.roles.add(roleToSet);

    if (i % maxPerBatch == 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return results;
}
