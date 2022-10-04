
import { Client, Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { ALPHANUMERIC, INFO_MSG_TIME_DEL, PREFIX } from "../common/constants";
import { deleteMessage, isValidUser, sendMessage, sendMessageEmbed } from '../utils';
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
    const lineups = cache.getLineups();
    const lineupsListEmbed = new MessageEmbed().setTitle('Lineups');
    lineups.forEach((gameLineup, gameName) => {
        const capitalisedGameName = `${gameName[0].toLocaleUpperCase()}${gameName.slice(1)}`;
        const gameLineupsString = gameLineup.length ? `\`${gameLineup.join(', ')}\`` : '\`No players in lineup\`';
        lineupsListEmbed.addField(capitalisedGameName, gameLineupsString);
    });

    sendMessage(
        message.channel,
        lineupsListEmbed,
        (sentMessage : Message) => deleteMessage(sentMessage, INFO_MSG_TIME_DEL),
    );
}

/**
 * Function to handle `.lineup add <game> <user id>`
 * Add the user to the game's lineup
 * @param parameters - contains the necessary parameters for the command
 */
 function lineupAdd(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (argsCount !== 2) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 2 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    const [gameName, user] = args.map(arg => arg?.toLowerCase());
    const gameNames = cache.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (!gameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
    }
    if (!isValidUser(user)) {
        errorMessages.push('Invalid user.');
    }
    // TODO: Add sending user role validation

    const game = cache.getGame(gameName);
    const lineup = cache.getLineup(gameName);
    if (lineup.includes(user)) {
        errorMessages.push(`User already in \`${gameName}\` lineup.`);
    } else if (!game.isInfinite && lineup.length >= game.limit) {
        errorMessages.push(`Lineup for \`${gameName}\` full.`);
    }


    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // arguments validated
    cache.addUserToLineup(bot, message, gameName, user);
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
    aliases: ['lineup list', 'lineup all', 'lineups', 'lineups list', 'lineups all'],
    run: lineupList,
    formats: ['lineup list'],
    descriptions: ['see the list of all game lineups'],
}, {
    aliases: ['lineup add'],
    run: lineupAdd,
    formats: ['lineup add <game> <user id>'],
    descriptions: ['add a user to a game\'s lineup'],
}, {
    aliases: ['lineup'],
    run: invalidLineupCommand,
}];

export default lineupCommands;
