import { Client, Message } from 'discord.js';
import { LocalCache } from '../caches/index.js';
import { ALPHANUMERIC, PREFIX } from '../common/constants.js';
import { sendDebugErrorMessage, sendMessageEmbed } from '../utils/index.js';
import { CommandInputs } from './processCommand.js';

/**
 * Function to handle `.user view <game/s>`
 * View list of games saved by the user
 * @param parameters - contains the necessary parameters for the command
 */
 function userView(commandInputs : CommandInputs) {
    const {
        args, cache, command, message,
    } : {
        args : Array<string>, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // first validation
    const argsCount = args.length;
    if (argsCount > 0) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting at 0 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    // non-blocking validation and actual cache+db actions
    const userId = `<@${message.author.id}>`;
    cache.confirmUserInit(userId).then(() => {
        const userGames = cache.getUserGames(userId);
        const title = `Saved Games - ${message.author.username}`;
        const content = userGames.length ? `${userGames.join('\n')}` : 'No games saved';
        sendMessageEmbed(message.channel, title, { Games: content });
    });
}

/**
 * Function to handle `.user save <game/s>`
 * Save game/s to user's game list
 * @param parameters - contains the necessary parameters for the command
 */
function userSave(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // first validation
    const argsCount = args.length;
    if (argsCount < 1) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting at least 1 argument for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    // blocking game args validation
    const errorMessages = [];
    const gameNames = Array(...new Set(args.map(arg => arg?.trim()?.toLowerCase())));
    const storedGameNames = cache.getGameNames();

    if (!(gameNames.length === 1 && gameNames[0] === 'all')) { // validate game names
        gameNames.forEach((gameName) => {
            if (!ALPHANUMERIC.test(gameName)) {
                errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
            } else if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
        });
    }

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // non-blocking validation and actual cache+db actions
    const userId = `<@${message.author.id}>`;
    cache.confirmUserInit(userId).then(() => {
        const {
            unsavedGames : validGameNames,
            savedGames : invalidGameNames,
        } = cache.processIfUserHasGames(userId, gameNames[0] === 'all' ? storedGameNames : gameNames);

        // info messages and actual cache operations
        const content = {};

        if (invalidGameNames.length) {
            content['Following games already saved in user\'s games list'] = `\`${invalidGameNames.join(' ')}\``;
        }

        if (validGameNames.length) {
            cache.saveToUserGames(userId, gameNames).then(() => {
                content['Successfully saved the following games to your gameslist'] = `\`${validGameNames.join(' ')}\``;
                sendMessageEmbed(message.channel, 'Notification', content);
            }).catch((error : Error) => sendDebugErrorMessage(bot, error));
        } else {
            content['No games saved'] = 'All specified games already in user\'s saved games list';
            sendMessageEmbed(message.channel, 'Notification', content);
        }
    });
}

/**
 * Function to handle `.user remove <game/s>`
 * Remove game/s from user's game list
 * @param parameters - contains the necessary parameters for the command
 */
function userRemove(commandInputs : CommandInputs) {
const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // first validation
    const argsCount = args.length;
    if (argsCount < 1) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting at least 1 argument for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    // blocking game args validation
    const errorMessages = [];
    const gameNames = Array(...new Set(args.map(arg => arg?.trim()?.toLowerCase())));
    const storedGameNames = cache.getGameNames();

    if (!(gameNames.length === 1 && gameNames[0] === 'all')) { // validate game names
        gameNames.forEach((gameName) => {
            if (!ALPHANUMERIC.test(gameName)) {
                errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
            } else if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
        });
    }

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // non-blocking validation and actual cache+db actions
    const userId = `<@${message.author.id}>`;
    cache.confirmUserInit(userId).then(() => {
        const {
            savedGames : validGameNames,
            unsavedGames : invalidGameNames,
        } = cache.processIfUserHasGames(userId, gameNames[0] === 'all' ? storedGameNames : gameNames);

        // info messages and actual cache operations
        const content = {};

        if (invalidGameNames.length) {
            content['Following games are not saved in the user\'s games list'] = `\`${invalidGameNames.join(' ')}\``;
        }

        if (validGameNames.length) {
            cache.removeFromUserGames(userId, gameNames).then(() => {
                content['Successfully removed the following games from your games list'] = `\`${validGameNames.join(' ')}\``;
                sendMessageEmbed(message.channel, 'Notification', content);
            }).catch((error : Error) => sendDebugErrorMessage(bot, error));
        } else {
            content['No games removed'] = 'None of the specified games are in the user\'s games list';
            sendMessageEmbed(message.channel, 'Notification', content);
        }
    });
}

/**
 * Function to handle `.user clear`
 * Clear all games from user's game list
 * @param parameters - contains the necessary parameters for the command
 */
 function userClear(commandInputs : CommandInputs) {
    const {
        args, cache, command, message,
    } : {
        args : Array<string>, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // first validation
    const argsCount = args.length;
    if (argsCount > 0) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting at 0 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    // non-blocking validation and actual cache+db actions
    const userId = `<@${message.author.id}>`;
    cache.confirmUserInit(userId).then(() => {
        cache.clearUserGames(userId).then(() => {
            sendMessageEmbed(message.channel, 'Notification', 'Removed all games from user\'s save list');
        }, (error) => {
            sendMessageEmbed(message.channel, 'Error Notification ', error);
        });
    });
}

/**
 * Inform user command as invalid
 * @param parameters - contains the necessary parameters for the command
 */
function invalidUserCommand(commandInputs : CommandInputs) {
    const { args, message } : { args : Array<string>, message : Message } = commandInputs;

    if (args.length === 0) {
        sendMessageEmbed(
            message.channel,
            `Invalid \`${PREFIX}user\` command`,
            `
                Command for \`${PREFIX}user\` lacking.
                Possible options include \`save\`, and \`remove\`.
                ie. \`.user save\`
            `,
        );
        return;
    }
    sendMessageEmbed(
        message.channel,
        `Invalid \`${PREFIX}user\` command`,
        `Command for \`${PREFIX}user\` unrecognized.`,
    );
}

/**
 * Commands for users
 */
const userCommands = [{
    name: 'User View',
    aliases: ['user view', 'view', 'user savelist', 'savelist', 'user save list', 'save list'],
    run: userView,
    formats: ['view'],
    descriptions: ['view list of games saved by the user'],
}, {
    name: 'User Save',
    aliases: ['user save', 'save'],
    run: userSave,
    formats: ['save <game/s>'],
    descriptions: ['save game/s to user list'],
}, {
    name: 'User Remove',
    aliases: ['user remove', 'remove'],
    run: userRemove,
    formats: ['remove <game/s>'],
    descriptions: ['remove game/s from user save list'],
}, {
    name: 'User Clear',
    aliases: ['user clear', 'clear'],
    run: userClear,
    formats: ['clear'],
    descriptions: ['clear all games from user save list'],
}, {
    aliases: ['user'],
    run: invalidUserCommand,
}];

export default userCommands;
