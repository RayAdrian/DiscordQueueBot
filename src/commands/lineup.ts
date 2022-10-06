
import { Client, Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { ALPHANUMERIC, INFO_MSG_TIME_DEL, PREFIX } from "../common/constants";
import { deleteMessage, isValidUser, sendMessage, sendMessageEmbed } from '../utils';
import { CommandInputs } from './processCommand';

/**
 * Function for lineup list commands
 * Sends list of all lineups
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupList(commandInputs : CommandInputs) {
    const { args, cache, message } : {
        args : Array<string>, cache : LocalCache, message : Message,
    } = commandInputs;

    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());

    // check if lineup list has specified games
    if (
        gameNames.length === 0
        || (gameNames.length === 1 && gameNames[0] === 'all')
    ) { // list all lineups
        const lineups = cache.getLineups();
        const content = {};
        lineups.forEach((gameLineup, gameName) => {
            const capitalisedGameName = `${gameName[0].toLocaleUpperCase()}${gameName.slice(1)}`;
            const gameLineupsString = gameLineup.length ? `${gameLineup.join(' ')}` : '\`No players in lineup\`';
            content[capitalisedGameName] = gameLineupsString;
        })
        sendMessageEmbed(message.channel, 'Lineups', content);
    } else if (gameNames.length > 0) { // list specified lineups
        // validation
        const errorMessages = []; 
        const storedGameNames = cache.getGameNames();
        const uniqueGameNames = new Set<string>(...gameNames);

        gameNames.forEach((gameName) => {
            if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
            uniqueGameNames.add(gameName);
        })

        if (errorMessages.length) {
            sendMessageEmbed(
                message.channel,
                'Invalid arguments',
                errorMessages.join('\n'),
            );
            return;
        }
    
        // arguments validated
        const lineups = cache.getFilteredLineups(Array(...uniqueGameNames));
        const content = {};
        lineups.forEach((gameLineup, gameName) => {
            const capitalisedGameName = `${gameName[0].toLocaleUpperCase()}${gameName.slice(1)}`;
            const gameLineupsString = gameLineup.length ? `${gameLineup.join(' ')}` : '\`No players in lineup\`';
            content[capitalisedGameName] = gameLineupsString;
        })
        sendMessageEmbed(message.channel, 'Lineups', content);
    }
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
        errorMessages.push(`User already in the \`${gameName}\` lineup.`);
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
 * Function to handle `.lineup join <game>`
 * Add the user that sent the message to the game's lineup
 * @param parameters - contains the necessary parameters for the command
 */
function lineupJoin(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (argsCount !== 1) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 1 argument for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    const [gameName] = args.map(arg => arg?.toLowerCase());
    const gameNames = cache.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (!gameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
    }

    const user = `<@${message.author.id}>`;
    const game = cache.getGame(gameName);
    const lineup = cache.getLineup(gameName);
    if (lineup.includes(user)) {
        errorMessages.push(`You are already in the \`${gameName}\` lineup.`);
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
 * Function to handle `.lineup kick <game> <user id>`
 * Remove the user from the game's lineup
 * @param parameters - contains the necessary parameters for the command
 */
function lineupKick(commandInputs : CommandInputs) {
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

    const lineup = cache.getLineup(gameName);
    if (!lineup.includes(user)) {
        errorMessages.push(`User not in the \`${gameName}\` lineup.`);
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
    cache.removeUserFromLineup(bot, message, gameName, user);
}

/**
 * Function to handle `lineup reset` commands
 * Remove the user from the game's lineup
 * @param parameters - contains the necessary parameters for the command
 */
 function lineupReset(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const errorMessages = []; 
    // TODO: Add sending user role validation

    const gameNames = args.map(arg => arg?.toLowerCase());
    const storedGameNames = cache.getGameNames();

    const uniqueGameNames = new Set<string>();
    gameNames.forEach((gameName) => {
        if (!storedGameNames.includes(gameName)) {
            errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
        }
        uniqueGameNames.add(gameName);
    })

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // arguments validated
    if (args.length === 0) {
        cache.resetAllLineups();
        sendMessageEmbed(
            message.channel,
            'Notification',
            'All lineups have been reset.',
        );
    } else if (uniqueGameNames.size > 0) {
        cache.resetLineups([...uniqueGameNames]);
        const fieldTitle = 'The following lineups have been reset';
        sendMessageEmbed(
            message.channel,
            'Notification',
            {
                [fieldTitle]: [...uniqueGameNames].join('\n'),
            },
        );
    } else {
        sendMessageEmbed(
            message.channel,
            'Notification',
            'No lineup has been reset.'
        );
    }
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
    aliases: ['lineup list', 'lineup', 'lineups list', 'lineups'],
    run: lineupList,
    formats: ['lineup list', 'lineup list <game1> <game2> ...',],
    descriptions: ['see the list of all game lineups', 'see the list of specified game lineups'],
}, {
    aliases: ['lineup add', 'add'],
    run: lineupAdd,
    formats: ['lineup add <game> <user id>'],
    descriptions: ['add a user to a game\'s lineup'],
}, {
    aliases: ['lineup join', 'join'],
    run: lineupJoin,
    formats: ['lineup join <game>'],
    descriptions: ['add the user that sent the message to a game\'s lineup'],
}, {
    aliases: ['lineup kick', 'kick'],
    run: lineupKick,
    formats: ['lineup kick <game>'],
    descriptions: ['remove a user from a game\'s lineup'],
}, {
    aliases: ['lineup reset', 'reset'],
    run: lineupReset,
    formats: ['lineup reset', 'lineup reset <game1> <game2> ...'],
    descriptions: ['reset all lineups', 'reset the specified lineups'],
}, {
    aliases: ['lineup'],
    run: invalidLineupCommand,
}];

export default lineupCommands;
