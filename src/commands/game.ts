import { Client, Message } from 'discord.js';
import { ALPHANUMERIC, PREFIX, RESERVED_KEYWORDS } from '../common/constants.js';
import ServiceProvider from '../services/serviceProvider.js';
import { isValidLimit, isValidRole, sendDebugErrorMessage } from '../utils/index.js';
import sendMessage from '../utils/sendMessage.js';
import { CommandInputs } from './processCommand.js';

/**
 * Function for game list command
 * Sends list of all available games
 * @param commandInputs - contains the necessary parameters for the command
 */
async function gameList(commandInputs : CommandInputs) {
    const { args, command, message, serviceProvider } : {
        args : Array<string>, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount !== 0) {
        const content = {
            'Unexpected number of arguments': `Expecting no arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.game list\`',
        };
        sendMessage(message.channel, content, 'error', 'Game List');
        return;
    }

    // arguments validated
    const gameNames = await gameService.getGameNames();
    const content = {
        'Current available games': gameNames.length ? gameNames.join('\n') : 'No games available',
    };
    sendMessage(message.channel, content, 'information', 'Game List');
}

/**
 * Function to handle `.game <game>`
 * Show the info pertaining to a game
 * @param commandInputs - contains the necessary parameters for the command
 */
 async function gameDescribe(commandInputs : CommandInputs) {
    const {
        args, command, message, serviceProvider,
    } : {
        args : Array<string>, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount !== 1) {
        const content = {
            'Unexpected number of arguments': `Expecting 1 argument for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.game <game>\`',
        };
        sendMessage(message.channel, content, 'error', 'Game Describe');
        return;
    }
 
    const gameName = args[0].toLowerCase();
    const gameNames = await gameService.getGameNames();
    let errorMessage = '';

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessage = 'Invalid game name. Should only consist of alphanumeric characters.';
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessage = 'Invalid game name. Uses a reserved keyword.';
    }
    else if (!gameNames.includes(gameName)) {
        errorMessage = 'Invalid game name. Does not exist.';
    }

    if (errorMessage.length) {
        const content = { 'Invalid argument': errorMessage };
        sendMessage(message.channel, content, 'error', 'Game Description');
        return;
    }

    // arguments validated
    const game = await gameService.getGame(gameName);
    const descriptionMessage = {
        'Information': `
            name - ${game.getName()}
            role - ${game.getRoleId()}
            limit - ${game.getLimit() === 0 ? 'none' : game.getLimit()}
        `,
    };
    sendMessage(message.channel, descriptionMessage, 'information', `Game Description - ${gameName}`);
}

/**
 * Function to handle `.game add <game> <role> <limit>`
 * Add a game
 * @param commandInputs - contains the necessary parameters for the command
 */
async function gameAdd(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount !== 3) {
        const content = {
            'Unexpected number of arguments': `Expecting 3 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.game add <game> <role> <limit>\`',
        };
        sendMessage(message.channel, content, 'error', 'Game Add');
        return;
    }

    const [gameName, role, limit] = args.map(arg => arg?.toLowerCase());
    const gameNames = await gameService.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid new game name. Should only consist of alphanumeric characters.');
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessages.push('Invalid new game name. Uses a reserved keyword.');
    } else if (gameNames.includes(gameName)) {
        errorMessages.push('Invalid new game name. Already exists.');
    }
    if (!isValidRole(role)) {
        errorMessages.push('Invalid role.');
    }
    if (!isValidLimit(limit)) {
        errorMessages.push('Invalid value for limit. Should be a non-negative integer.');
    }

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Game Add');
        return;
    }

    // arguments validated
    gameService.addGame(gameName, role, Number(limit)).then((newGame) => {
        const newGameName = newGame.getName();
        const content = {
            'Notification': `Game and Lineup for \`${newGameName}\` added.`,
        };
        sendMessage(message.channel, content, 'success', `Game Add - ${newGameName}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `.game remove <game>`
 * Remove a game
 * @param commandInputs - contains the necessary parameters for the command
 */
async function gameRemove(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount !== 1) {
        const content = {
            'Unexpected number of arguments': `Expecting 1 argument for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.game remove <game>\`',
        };
        sendMessage(message.channel, content, 'error', 'Game Remove');
        return;
    }
 
    const gameName = args[0].toLowerCase();
    const gameNames = await gameService.getGameNames();
    let errorMessage = '';

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessage = 'Invalid game name. Should only consist of alphanumeric characters.';
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessage = 'Invalid game name. Uses a reserved keyword.';
    } else if (!gameNames.includes(gameName)) {
        errorMessage = 'Invalid game name. Does not exist.';
    }

    if (errorMessage.length) {
        const content = { 'Invalid argument': errorMessage };
        sendMessage(message.channel, content, 'error', 'Game Remove');
        return;
    }

    // arguments validated
    gameService.removeGame(gameName).then(() => {
        const content = {
            'Notification':  `Game and Lineup/s for \`${gameName}\` deleted.`,
        };
        sendMessage(message.channel, content, 'success', `Game Remove - ${gameName}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `.game edit <game> <role> <?limit>`
 * Edit a game's set parameters
 * @param commandInputs - contains the necessary parameters for the command
 */
async function gameEdit(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (![2, 3].includes(argsCount)) {
        const content = {
            'Unexpected number of arguments': `Expecting 2 or 3 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.game edit <game> <role>\`\n\`.game edit <game> <role> <limit>\`',
        };
        sendMessage(message.channel, content, 'error', 'Game Edit');
        return;
    }
 
    const [gameName, role, limit] = args.map(arg => arg?.toLowerCase());
    const gameNames = await gameService.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (RESERVED_KEYWORDS.includes(gameName)) {
        errorMessages.push('Invalid game name. Uses a reserved keyword.');
    } else if (!gameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Does not exist. Perhaps you meant to use \`${PREFIX}game add\`?`);
    }
    if (!isValidRole(role)) {
        errorMessages.push('Invalid role.');
    }
    if (limit && !isValidLimit(limit)) {
        errorMessages.push('Invalid value for limit. Should be a non-negative integer.');
    }

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Game Edit');
        return;
    }

    // arguments validated
    gameService.editGame(gameName, role, limit).then((editedGame) => {
        const editedGameName = editedGame.getName();
        const content = {
            'Notification': `Game \`${editedGameName}\` edited.`,
        };
        sendMessage(message.channel, content, 'success', `Game Edit - ${editedGameName}`);
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', `Game Edit - ${gameName}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Commands for games
 */
const gameCommands = [{
    name: 'Game List',
    aliases: ['game list', 'gamelist', 'games'],
    run: gameList,
    formats: ['game list'],
    descriptions: ['see the list of all available games'],
}, {
    name: 'Game Add',
    aliases: ['game add'],
    run: gameAdd,
    formats: ['game add <game> <role> <limit>'],
    descriptions: ['add a game'],
}, {
    name: 'Game Remove',
    aliases: ['game remove', 'game delete'],
    run: gameRemove,
    formats: ['game remove <game>'],
    descriptions: ['delete a game'],
}, {
    name: 'Game Edit',
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
    name: 'Game Describe',
    aliases: ['game describe', 'game', 'describe'],
    run: gameDescribe,
    formats: ['game <game>'],
    descriptions: ['describe a game'],
}];

export default gameCommands;
