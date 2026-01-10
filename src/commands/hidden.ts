import { Client, Message, TextChannel } from "discord.js";
import LocalCache from "../caches/local.js";
import {
  COPYPASTA_COOLDOWN,
  COPYPASTA_DELAY,
  MAIN_CHANNEL_ID,
} from "../common/constants.js";
import { CLUB_PENGUIN } from "../common/copypastas.js";
import sendMessage from "../utils/sendMessage.js";
import { CommandInputs } from "./processCommand.js";

/**
 * Function to handle hidden command `.♣️🐧`
 * Respond with the `Club Penguin` copypasta
 * @param commandInputs - contains the necessary parameters for the command
 */
function clubPenguin(commandInputs: CommandInputs) {
  const {
    args,
    cache,
    command,
    message,
  }: {
    args: Array<string>;
    cache: LocalCache;
    command: string;
    message: Message;
  } = commandInputs;

  const argsCount = args.length;
  if (argsCount !== 0) {
    return;
  }

  // check if in cooldown
  const endCooldown = cache.getCooldown("club penguin");
  const now = new Date();
  if (endCooldown && endCooldown > now) {
    const remainingDuration = (
      (endCooldown.getTime() - now.getTime()) /
      1000
    ).toFixed(0);
    const content = {
      "Command Cooldown": `.\`${command}\` is in cooldown for ${remainingDuration} more seconds.`,
    };
    sendMessage(message.channel, content, "error", command);
    return;
  }

  // send copypasta line per line with delay
  CLUB_PENGUIN.split("\n").forEach((line, index) => {
    const delay = COPYPASTA_DELAY * index;
    setTimeout(() => sendMessage(message.channel, line, "meme"), delay);
  });

  // set cooldown
  cache.addCooldown("club penguin", COPYPASTA_COOLDOWN);
}

/**
 * Function to handle hidden command `.say`
 * Makes the bot send a custom message to the channel
 * @param commandInputs - contains the necessary parameters for the command
 */
function say(commandInputs: CommandInputs) {
  const {
    args,
    bot,
  }: {
    args: Array<string>;
    bot: Client;
  } = commandInputs;

  if (args.length === 0) {
    return;
  }

  const channel = bot.channels.cache.get(MAIN_CHANNEL_ID) as TextChannel;
  if (!channel) {
    return;
  }

  const content = args.join(" ");
  sendMessage(channel, content, "meme");
}

/**
 * Hidden Commands
 */
const hiddenCommands = [
  {
    name: "Club Penguin",
    aliases: ["♣️🐧"],
    run: clubPenguin,
    formats: ["♣️🐧"],
    descriptions: ["Respond with the `Club Penguin` copypasta"],
  },
  {
    name: "Say",
    aliases: ["say"],
    run: say,
    formats: ["say <message>"],
    descriptions: ["Make the bot send a custom message"],
  },
];

export default hiddenCommands;
