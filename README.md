# Choob_Bot

Choob_Bot is a Twitch chat bot created for the MCDM community.

## Commands

- !choob
  - Responds with a random quote pulled from settings
- !choobcount
  - Responds with the current number of choob quotes in the settings.json file
- !choob-info
  - Responds with a blurb about how "choob" originated
- !choob-channels
  - Responds with the current number of channels the bot is active in
- !join-choob
  - Have Choob_Bot join your Twitch channel
  - Must be triggered in the Choob_Bot Twitch channel
- !leave-choob
  - Have Choob_Bot leave your Twitch channel
  - Must be triggered in the Choob_Bot Twitch channel
- !toggle-choob
  - Disables the use of !choob in the channel
  - Can only be triggered by a channel Moderator
- !add-choob [choob message]
  - Adds the choob message to the list of choob quotes in the settings.json file
  - Can only be triggered by an Admin
- !remove-choob [choob message]
  - Removes the choob message from the list of choob quotes in the settings.json file
  - Can only be triggered by an Admin
- !update-choob
  - Manually triggers an update pull of the settings.json file
  - Can only be triggered by a Super Admin
- !choob-version
  - Reports the current version of Choob_Bot

hyphens are optional
