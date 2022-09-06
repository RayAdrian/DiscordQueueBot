import { Client, Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { ALPHANUMERIC, PREFIX, RESERVED_KEYWORDS } from "../common/constants";
import { isValidLimit, isValidRole, sendMessage, sendMessageEmbed } from "../utils";

/**
 * Function to handle `.game add <name> <role> <limit>`
 * Add a game
 * @param bot - for sending error messages
 * @param message - param that contains Channel object to send to
 * @param cache - param containing list of available games
 */
function gameAdd(bot : Client, message : Message, cache : LocalCache) {
    // validation
    const args = message.content.substring(PREFIX.length).split(' ').slice(2);
    const argsCount = args.length;
    if (argsCount !== 3) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 3 arguments for \`${PREFIX}game add\`. Received ${argsCount}.`,
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
    if (!isValidRole(role)) {
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
 * @param bot - for sending error messages
 * @param message - param that contains Channel object to send to
 * @param cache - param containing list of available games
 */
function gameEdit(bot : Client, message : Message, cache : LocalCache) {
    // validation
    const args = message.content.substring(PREFIX.length).split(' ').slice(2);
    const argsCount = args.length;
    if (![2, 3].includes(argsCount)) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 2 or 3 arguments for \`${PREFIX}game edit\`. Received ${argsCount}.`,
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
    if (!isValidRole(role)) {
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
 * Function for game list command
 * Sends list of all available games
 * @param message - param that contains Channel object to send to
 * @param cache - param containing list of available games
 */
function gameList(message : Message, cache : LocalCache) {
    // validation
    const argsCount = message.content.substring(PREFIX.length).split(' ').slice(2).length;
    if (argsCount !== 0) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting no arguments for \`${PREFIX}game list\`. Received ${argsCount}.`,
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

function gameRemove(message : Message, cache : LocalCache) {
    // validation
    const args = message.content.substring(PREFIX.length).split(' ').slice(2);
    const argsCount = args.length;
    if (argsCount !== 1) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting 1 argument for \`${PREFIX}game edit\`. Received ${argsCount}.`,
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
}

/**
 * Function for the game command and it's subcommands.
 * Used to add, edit, list, and remove games from the database.
 * @param bot
 * @param message
 * @param cache
 */
export default function game(bot : Client, message : Message, cache : LocalCache) {
    const args = message.content.substring(PREFIX.length).split(' ');
    const command = args[0].toLowerCase();
    const subCommand = args[1]?.toLowerCase();

    switch(command) { // allow aliases for certain commands
        case 'gamelist':
        case 'games':
            gameList(message, cache);
            return;
    }
    
    if (!subCommand) {
        sendMessageEmbed(
            message.channel,
            'Wrong command',
            `Missing a subcommand for \`${PREFIX}game\`. Type \`${PREFIX}help\` for more details.`,
        );
    }

    switch(subCommand) {
        case 'list':
            gameList(message, cache);
            break;
        case 'add':
            gameAdd(bot, message, cache);
            break;
        case 'edit':
            gameEdit(bot, message, cache);
            break;
        case 'remove':
            gameRemove(message, cache);
            break;
    }
}