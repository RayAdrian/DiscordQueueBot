import { Client, Message, MessageEmbed } from 'discord.js';
import { LocalCache } from '../caches';
import { ALPHANUMERIC, PREFIX, RESERVED_KEYWORDS } from '../common/constants';
import { isValidLimit, isValidId, sendMessage, sendMessageEmbed } from '../utils';
import { CommandInputs } from './processCommand';

/**
 * Function for game list command
 * Sends list of all available games
 * @param commandInputs - contains the necessary parameters for the command
 */
function gameList(commandInputs : CommandInputs) {
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
    const gameNames = cache.gamesCache.getGameNames();
    const gameListEmbed = new MessageEmbed()
        .setTitle('Game List')
        .addField('Current available games', gameNames.length ? gameNames.join('\n') : 'No games available');
    sendMessage(message.channel, gameListEmbed, () => {});
}

/**
 * Function to handle `.game add <name> <role> <limit>`
 * Add a game
 * @param parameters - contains the necessary parameters for the command
 */
function gameAdd(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (argsCount !== 3) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 3 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    const [gameName, role, limit] = args.map(arg => arg?.toLowerCase());
    const gameNames = cache.gamesCache.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid new game name. Should only consist of alphanumeric characters.');
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessages.push('Invalid new game name. Uses a reserved keyword.');
    } else if (gameNames.includes(gameName)) {
        errorMessages.push('Invalid new game name. Already exists.');
    }
    if (!isValidId(role)) {
        errorMessages.push('Invalid role.');
    }
    if (!isValidLimit(limit)) {
        errorMessages.push('Invalid value for limit. Should be a non-negative integer.');
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
    cache.gamesCache.addGame(bot, message, gameName, role, Number(limit));
}

/**
 * Function to handle `.game edit <name> <role> <?limit>`
 * Edit a game's set parameters
 * @param parameters - contains the necessary parameters for the command
 */
function gameEdit(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (![2, 3].includes(argsCount)) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 2 or 3 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }
 
    const [gameName, role, limit] = args.map(arg => arg?.toLowerCase());
    const gameNames = cache.gamesCache.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessages.push('Invalid game name. Uses a reserved keyword.');
    } else if (!gameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Does not exist. Perhaps you meant to use \`${PREFIX}game add\`?`);
    }
    if (!isValidId(role)) {
        errorMessages.push('Invalid role.');
    }
    if (limit && !isValidLimit(limit)) {
        errorMessages.push('Invalid value for limit. Should be a non-negative integer.');
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
    cache.gamesCache.editGame(bot, message, gameName, role, limit);
}

/**
 * Function to handle `.game remove <name>`
 * Remove a game
 * @param parameters - contains the necessary parameters for the command
 */
function gameRemove(commandInputs : CommandInputs) {
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
 
    const gameName = args[0].toLowerCase();
    const gameNames = cache.gamesCache.getGameNames();
    let errorMessage = '';

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessage = 'Invalid game name. Should only consist of alphanumeric characters.';
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessage = 'Invalid game name. Uses a reserved keyword.';
    } else if (!gameNames.includes(gameName)) {
        errorMessage = 'Invalid game name. Does not exist.';
    }

    if (errorMessage.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid argument',
            errorMessage,
        );
        return;
    }

    // arguments validated
    cache.gamesCache.removeGame(bot, message, gameName);
}

/**
 * Inform game command as invalid
 * @param parameters - contains the necessary parameters for the command
 */
function invalidGameCommand(commandInputs : CommandInputs) {
    const { args, message } : { args : Array<string>, message : Message } = commandInputs;

    if (args.length === 0) {
        sendMessageEmbed(
            message.channel,
            `Invalid \`${PREFIX}game\` command`,
            `
                Command for \`${PREFIX}game\` lacking.
                Possible options include \`list\`, \`add\`, \`edit\`, and \`remove\`.
                ie. \`.game list\`
            `,
        );
        return;
    }
    sendMessageEmbed(
        message.channel,
        `Invalid \`${PREFIX}game\` command`,
        `Command for \`${PREFIX}game\` unrecognized.`,
    );
}

/**
 * Commands for games
 */
const gameCommands = [{
    aliases: ['game list', 'gamelist', 'games'],
    run: gameList,
    formats: ['game list'],
    descriptions: ['see the list of all available games'],
}, {
    aliases: ['game add'],
    run: gameAdd,
    formats: ['game add <game> <role> <limit>'],
    descriptions: ['add a game'],
}, {
    aliases: ['game edit'],
    run: gameEdit,
    formats: [
        'game edit <game> <role>',
        'game edit <game> <role> <limit>',
    ],
    descriptions: [
        'edit a game\'s role',
        'edit a game\'s role and limit',
    ],
}, {
    aliases: ['game remove'],
    run: gameRemove,
    formats: ['game remove <game>'],
    descriptions: ['delete a game'],
}, {
    aliases: ['game'],
    run: invalidGameCommand,
}];

export default gameCommands;
