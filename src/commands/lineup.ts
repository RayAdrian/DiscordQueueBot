
import { Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { PREFIX } from "../common/constants";
import { sendMessage, sendMessageEmbed } from '../utils';
import { CommandInputs } from './processCommand';

/**
 * Function for lineup list command
 * Sends list of all lineups
 * @param commandInputs - contains the necessary parameters for the command
 */
 function lineupList(commandInputs : CommandInputs) {
  const { args, cache, command, message } : {
      args : Array<string>, cache : LocalCache, command : string, message : Message,
  } = commandInputs;

  // validation
  const argsCount = args.length;
  if (argsCount !== 0) {
      sendMessageEmbed(
          message.channel,
          'Unexpected number of arguments',
          `Expected 0 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
      );
      return;
  }

  // arguments validated
  const lineups = cache.lineupsCache.getLineups();
  const lineupsListEmbed = new MessageEmbed()
      .setTitle('Lineups');
  lineups.forEach((gameLineups, gameName) => {
    const capitalisedGameName = `${gameName[0].toLocaleUpperCase()}${gameName.slice(1)}`;
    if (gameLineups.length === 0) {
      lineupsListEmbed.addField(capitalisedGameName, 'No lineups');
    } else {
      const gameLineupsString = gameLineups.length ? gameLineups.map(
        (gameLineup, index) => `\`${index}\` : \`${gameLineup.join(', ')}\``,
      ).join('\n') : '\`No players in lineup\`';
      lineupsListEmbed.addField(capitalisedGameName, gameLineupsString);
    }
  });

  sendMessage(message.channel, lineupsListEmbed, () => {});
}

/**
 * Inform lineup command as invalid
 * @param parameters - contains the necessary parameters for the command
 */
function invalidLineupCommand(commandInputs : CommandInputs) {
    const { args, message } : { args : Array<string>, message : Message } = commandInputs;

    if (args.length === 0) {
        sendMessageEmbed(
            message.channel,
            `Invalid \`${PREFIX}lineup\` command`,
            `
                Command for \`${PREFIX}lineup\` lacking.
                Possible options include \`list\`, \`join\`, \`add\`, \`kick\`, \`reset\`, and \`<game name>\`.
                ie. \`.lineup list\`
            `,
        );
        return;
  }
  sendMessageEmbed(
      message.channel,
      `Invalid \`${PREFIX}lineup\` command`,
      `Command for \`${PREFIX}lineup\` unrecognized.`,
  );
}

/**
 * Commands for lineups
 */
const lineupCommands = [{
  aliases: ['lineup list', 'lineups'],
  run: lineupList,
  formats: ['lineup list'],
  descriptions: ['see the list of all game lineups'],
}, {
  aliases: ['lineup'],
  run: invalidLineupCommand,
}];

export default lineupCommands;
