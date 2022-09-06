import { Client, Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { ALPHANUMERIC, PREFIX, RESERVED_KEYWORDS } from "../common/constants";
import { isValidCount, isValidRole, sendMessage, sendMessageEmbed } from "../utils";

function gameAdd(message : Message, cache : LocalCache) {
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

    const [gameName, role, count] = args.map(arg => arg?.toLowerCase());
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
    if (!isValidCount(count)) {
        errorMessages.push('Invalid value for count. Should be a non-negative integer.');
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
}

function gameEdit(message : Message, cache : LocalCache) {
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
 
    const [gameName, role, count] = args.map(arg => arg?.toLowerCase());
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
    if (!isValidCount(count)) {
        errorMessages.push('Invalid value for count. Should be a non-negative integer.');
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

export default function game(bot : Client, message : Message, cache : LocalCache) {
    const args = message.content.substring(PREFIX.length).split(' ');
    const subCommand = args[1]?.toLowerCase();
    
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
            gameAdd(message, cache);
            break;
        case 'edit':
            gameEdit(message, cache);
            break;
        case 'remove':
            gameRemove(message, cache);
            break;
    }
}