
import { Client, Message } from "discord.js";
import { LocalCache } from "../caches";
import { ALPHANUMERIC, PREFIX, READY_MESSAGE } from "../common/constants";
import { isValidUser, sendErrorMessage, sendMessage, sendMessageEmbed } from '../utils';
import { CommandInputs } from './processCommand';

/**
 * Worker function to check for complete lineups
 * @param commandInputs - contains cache to fetch lineups
 * @param gameNames - list of games to check
 * @param content - 
 */
function completeLineupWorker(
    commandInputs : CommandInputs, gameNames : Array<string>,
) {
    const { cache, message } : { cache : LocalCache, message : Message } = commandInputs;
    const completedLineupsStrings = [];
    const fullLineups = cache.getFilteredLineups(gameNames, true);

    fullLineups.forEach((lineup) => {
        completedLineupsStrings.push(`
            \`${lineup.getGameName().toLocaleUpperCase()}\` Lineup Complete: ${lineup.getUsers().join(' ')}
        `);
    });
    if (completedLineupsStrings.length > 0) {
        sendMessage(message.channel, completedLineupsStrings.join('\n'));
    }
}

/**
 * Function for `lineup list`  / `lineup list <game/s>` commands
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
        lineups.forEach((lineup) => {
            const capitalisedGameName = lineup.getGameName().toLocaleUpperCase();
            const gameLineupsString = lineup.getUserCount() ? `${lineup.getUsers().join(' ')}` : '\`No players in lineup\`';
            content[capitalisedGameName] = gameLineupsString;
        }) 
        sendMessageEmbed(message.channel, 'Lineups', content);
    } else if (gameNames.length > 0) { // list specified lineups
        // validation
        const errorMessages = []; 
        const storedGameNames = cache.getGameNames();

        gameNames.forEach((gameName) => {
            if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
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
        const uniqueGameNames = Array(...new Set(gameNames));
        const lineups = cache.getFilteredLineups(uniqueGameNames);
        const content = {};
        lineups.forEach((lineup) => {
            const capitalisedGameName = lineup.getGameName().toLocaleUpperCase();
            const gameLineupsString = lineup.getUserCount() ? `${lineup.getUsers().join(' ')}` : '\`No players in lineup\`';
            content[capitalisedGameName] = gameLineupsString;
        }) 
        sendMessageEmbed(message.channel, 'Lineups', content);
    }
}

/**
 * Function to handle `lineup add <game> <user id/s>`
 * Add the user to the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupAdd(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (argsCount < 2) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting at least 2 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    const [gameName, ...users] = args.map(arg => arg?.trim()?.toLowerCase());
    const storedGameNames = cache.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (!storedGameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
    } else if (cache.isLineupFull(gameName)) {
        errorMessages.push(`Lineup for \`${gameName}\` already full.`);
    }
    users
        .filter((user) => !isValidUser(user))
        .forEach((user) => errorMessages.push(`Invalid user \`${user}\`.`));
    // TODO: Add sending user role validation

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // non-blocking validation
    const lineup = cache.getLineup(gameName);
    const remainingSlotCount = cache.getLineupOpenings(gameName);

    const invalidUsers = []; // already in lineup
    const validUsers = []; // not in lineup
    let excludedUsers = []; // cannot be added due to full lineup

    users.forEach((user) => (!lineup.hasUser(user) ? validUsers : invalidUsers).push(user));

    // info messages and actual cache operations
    const content = {};

    if (validUsers.length > remainingSlotCount) { // can't add all users
        content['Information message'] = `
            Cannot add all the users to the \`${gameName}\` lineup.
            Adding only the first ${remainingSlotCount} users.
        `;
        excludedUsers = validUsers.splice(remainingSlotCount);
    }

    if (invalidUsers.length) {
        content['Following users already in the lineup'] = invalidUsers.join(' ');
    }

    if (excludedUsers.length) {
        content['Cannot add the following users'] = excludedUsers.join(' ');
    }

    if (validUsers.length) {
        cache.addUsersToLineup(gameName, validUsers).then(() => {
            content['Successfully added the following users'] = validUsers.join(' ');
            
            completeLineupWorker(commandInputs, [gameName]);
            sendMessageEmbed(message.channel, 'Lineups Add', content);
        }).catch((error : Error) => sendErrorMessage(bot, error));
    } else {
        content['No users added'] = 'No valid users';
        sendMessageEmbed(message.channel, 'Lineups Add', content);
    }
}

/**
 * Function to handle `lineup join <game/s>`
 * Add the user that sent the message to the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupJoin(commandInputs : CommandInputs) {
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
    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());
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

    // non-blocking game args validation
    const uniqueGameNames = Array(...new Set(gameNames));
    const user = `<@${message.author.id}>`;

    const fullGameNames = []; // full lineups
    const invalidGameNames = []; // lineups user is already in
    const validGameNames = []; // lineups user can join

    (gameNames[0] === 'all' ? storedGameNames : uniqueGameNames).forEach((gameName) => {
        if (cache.lineupHasUser(gameName, user)) {
            invalidGameNames.push(gameName);
        } else if (cache.isLineupFull(gameName)) {
            fullGameNames.push(gameName);
        } else {
            validGameNames.push(gameName);
        }
    });

    // info messages and actual cache operations
    const content = {};

    if (fullGameNames.length) {
        content['Following lineups are already full'] = `\`${fullGameNames.join(' ')}\``;
    }

    if (invalidGameNames.length) {
        content['User is already in the following lineups'] = `\`${invalidGameNames.join(' ')}\``;
    }

    if (validGameNames.length) {
        cache.joinLineups(validGameNames, user).then(() => {
            content['Successfully added the user to the following lineups'] = `\`${validGameNames.join(' ')}\``;
            completeLineupWorker(commandInputs, validGameNames);
            sendMessageEmbed(message.channel, 'Lineups Join', content);
        }).catch((error : Error) => sendErrorMessage(bot, error));

    } else {
        content['User not added to any lineup'] = 'No valid lineup';
        sendMessageEmbed(message.channel, 'Lineups Join', content);
    }

}

/**
 * Function to handle `lineup kick <game> <user id>`
 * Remove the user from the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupKick(commandInputs : CommandInputs) {
    const {
        args, bot, cache, command, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, command : string, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (argsCount < 2) {
        sendMessageEmbed(
            message.channel,
            'Unexpected number of arguments',
            `Expecting at least 2 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
        );
        return;
    }

    const [gameName, ...users] = args.map(arg => arg?.trim()?.toLowerCase());
    const storedGameNames = cache.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (!storedGameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
    }
    users
        .filter((user) => !isValidUser(user))
        .forEach((user) => errorMessages.push(`Invalid user \`${user}\`.`));
    // TODO: Add sending user role validation

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // non-blocking validation
    const lineup = cache.getLineup(gameName);
    const invalidUsers = []; // already in lineup
    const validUsers = []; // not in lineup

    users.forEach((user) => (lineup.hasUser(user) ? validUsers : invalidUsers).push(user));

    // info messages and actual cache operations
    const content = {};

    if (invalidUsers.length) {
        content['Following users not in the lineup'] = invalidUsers.join(' ');
    }

    if (validUsers.length) {
        cache.removeUsersFromLineup(gameName, validUsers).then(() => {
            content['Successfully kicked the following users'] = validUsers.join(' ');
            sendMessageEmbed(message.channel, 'Lineups Kick', content);
        }).catch((error : Error) => sendErrorMessage(bot, error));
    } else {
        content['No users kicked'] = 'No valid users';
        sendMessageEmbed(message.channel, 'Lineups Kick', content);
    }
}

/**
 * Function to handle `lineup leave` / `lineup leave <game/s>` commands
 * Remove the user either from all their lineups, or from specified lineups
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupLeave(commandInputs : CommandInputs) {
    const {
        args, bot, cache, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, message : Message,
    } = commandInputs;

    const user = `<@${message.author.id}>`;
    const userLineupNames = cache.getUserLineups(user).map((lineup) => lineup.getGameName());
    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());
    const isSpecifiedLeave = gameNames.length > 0;

    // blocking game args validation
    const errorMessages = [];

    if (isSpecifiedLeave) { // leave specified games
        // validate game names
        const storedGameNames = cache.getGameNames();
        gameNames.forEach((gameName) => {
            if (!ALPHANUMERIC.test(gameName)) {
                errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
            } else if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
        });
    } else { // leave all games user is in
        if (userLineupNames.length === 0) {
            errorMessages.push('User already not in any lineup.')
        }
    }

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // non-blocking game args validation
    const invalidGameNames = []; // lineups user is not in
    const validGameNames = isSpecifiedLeave ? [] : userLineupNames; // lineups user is in

    if (isSpecifiedLeave) {
        const uniqueGameNames = Array(...new Set(gameNames));
        uniqueGameNames.forEach((gameName) => {
            (userLineupNames.includes(gameName) ? validGameNames : invalidGameNames).push(gameName);
        });
    }

    // info messages and actual cache operations
    const content = {};

    if (invalidGameNames.length) {
        content['User not in the following lineups'] = `\`${invalidGameNames.join(' ')}\``;
    }

    if (validGameNames.length) {
        cache.leaveLineups(validGameNames, user).then(() => {
            content['User succesfully removed from the following lineups'] = `\`${validGameNames.join(' ')}\``;
            sendMessageEmbed(message.channel, 'Lineups Leave', content);
        }).catch((error : Error) => sendErrorMessage(bot, error));
    } else {
        content['User not removed from any lineup'] = 'No valid lineup';
        sendMessageEmbed(message.channel, 'Lineups Leave', content);
    }
}

/**
 * Function to handle `lineup reset` / `lineup reset <game/s>` commands
 * Remove the user from the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupReset(commandInputs : CommandInputs) {
    const {
        args, bot, cache, message,
    } : {
        args : Array<string>, bot : Client, cache : LocalCache, message : Message,
    } = commandInputs;

    // validation
    const errorMessages = []; 
    // TODO: Add sending user role validation

    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());
    const storedGameNames = cache.getGameNames();

    gameNames.forEach((gameName) => {
        if (!storedGameNames.includes(gameName)) {
            errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
        }
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
    const uniqueGameNames = Array(...new Set(gameNames));

    if (uniqueGameNames.length === 0) {
        cache.resetAllLineups().then(() => {
            sendMessageEmbed(
                message.channel,
                'Notification',
                'All lineups have been reset.',
            );
        }).catch((error : Error) => sendErrorMessage(bot, error));
    } else if (uniqueGameNames.length > 0) {
        cache.resetLineups(uniqueGameNames).then(() => {
            const fieldTitle = 'The following lineups have been reset';
            sendMessageEmbed(
                message.channel,
                'Notification',
                {
                    [fieldTitle]: uniqueGameNames.join('\n'),
                },
            );
        }).catch((error : Error) => sendErrorMessage(bot, error));
    } else {
        sendMessageEmbed(
            message.channel,
            'Notification',
            'No lineup has been reset.'
        );
    }
}

/**
 * Function to handle `lineup invite` / `lineup invite <game/s>` commands
 * Send invites for lineups depending on command args (or lack thereof)
 * @param commandInputs - contains the necessary parameters for the command
 */
function lineupInvite(commandInputs : CommandInputs) {
    const {
        args, cache, message,
    } : {
        args : Array<string>, cache : LocalCache, message : Message,
    } = commandInputs;

    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());
    const isSpecifiedInvite = gameNames.length > 0;
    let userLineupNames = [];

    // blocking game args validation
    const errorMessages = [];

    if (isSpecifiedInvite) { // invite specified games
        // validate game names
        const storedGameNames = cache.getGameNames();
        gameNames.forEach((gameName) => {
            if (!ALPHANUMERIC.test(gameName)) {
                errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
            } else if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
        });
    } else { // invite all games user is in
        const user = `<@${message.author.id}>`;
        userLineupNames = cache.getUserLineups(user).map((lineup) => lineup.getGameName());
        if (userLineupNames.length === 0) {
            errorMessages.push('User not in any lineup.')
        }
    }

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // non-blocking game args validation
    const uniqueGameNames = Array(...new Set(gameNames));

    const fullGameNames = []; // full lineups
    const validGameNames = []; // games that have available slots for invites

    (isSpecifiedInvite ? uniqueGameNames : userLineupNames).forEach((gameName) => {
        (cache.isLineupFull(gameName) ? fullGameNames : validGameNames).push(gameName);
    });

    // info messages and actual cache operations
    if (fullGameNames.length) {
        const content = {};
        content['Following lineups are already full'] = `\`${fullGameNames.join(' ')}\``;
        sendMessageEmbed(message.channel, 'Lineup Invites Info', content);
    }

    if (validGameNames.length) {
        const inviteMessage = `
            ${validGameNames.map((gameName) => {
                const role = cache.getRole(gameName);
                const slots = cache.getLineupOpenings(gameName);
                return `\`${gameName.toLocaleUpperCase()}\` ${role} +${slots}`;
            }).join('\n')}
        `;  
        sendMessage(message.channel, inviteMessage);
    }

}

/**
 * Function to handle `lineup ready` / `lineup ready <game/s>` commands
 * Notify people in lineups that it is ready
 * @param commandInputs - contains the necessary parameters for the command
 */
 function lineupReady(commandInputs : CommandInputs) {
    const {
        args, cache, message,
    } : {
        args : Array<string>, cache : LocalCache, message : Message,
    } = commandInputs;

    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());
    const isSpecifiedReady = gameNames.length > 0;
    let userLineupNames = [];

    // blocking game args validation
    const errorMessages = [];

    if (isSpecifiedReady) { // leave specified games
        // validate game names
        const storedGameNames = cache.getGameNames();
        gameNames.forEach((gameName) => {
            if (!ALPHANUMERIC.test(gameName)) {
                errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
            } else if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
        });
    } else { // leave all games user is in
        const user = `<@${message.author.id}>`;
        userLineupNames = cache.getUserLineups(user).map((lineup) => lineup.getGameName());;
        if (userLineupNames.length === 0) {
            errorMessages.push('User not in any lineup.')
        }
    }

    if (errorMessages.length) {
        sendMessageEmbed(
            message.channel,
            'Invalid arguments',
            errorMessages.join('\n'),
        );
        return;
    }

    // info messages and actual cache operations
    const uniqueGameNames = Array(...new Set(gameNames));
    const validGameNames = isSpecifiedReady ? uniqueGameNames : userLineupNames;

    if (validGameNames.length) {
        const readyMessages = [];
        const validLineups = cache.getFilteredLineups(validGameNames);
        validLineups.forEach((lineup) => {
            readyMessages.push(`${READY_MESSAGE} \`${lineup.getGameName().toLocaleUpperCase()}\` ${lineup.getUsers().join(' ')}`);
        });
        sendMessage(message.channel, readyMessages.join('\n'));
    } else {
        sendMessage(message.channel, 'No lineups ready');
    }
}


/**
 * Commands for lineups
 */
const lineupCommands = [{
    aliases: ['lineup add', 'add', 'lineups add'],
    run: lineupAdd,
    formats: ['lineup add <game> <user id>'],
    descriptions: ['add a user to a game\'s lineup'],
}, {
    aliases: ['lineup join', 'join', 'lineups join'],
    run: lineupJoin,
    formats: ['lineup join <game>'],
    descriptions: ['add the user that sent the message to a game\'s lineup'],
}, {
    aliases: ['lineup kick', 'kick', 'lineups kick'],
    run: lineupKick,
    formats: ['lineup kick <game>'],
    descriptions: ['remove a user from a game\'s lineup'],
}, {
    aliases: ['lineup leave', 'leave', 'lineups leave'],
    run: lineupLeave,
    formats: ['lineup leave', 'lineup leave <game1> <game2> ...'],
    descriptions: ['leave all lineups user is in', 'leave the specified lineups'],
},  {
    aliases: ['lineup reset', 'reset', 'lineups reset'],
    run: lineupReset,
    formats: ['lineup reset', 'lineup reset <game1> <game2> ...'],
    descriptions: ['reset all lineups', 'reset the specified lineups'],
}, {
    aliases: ['lineup invite', 'invite', 'lineups invite'],
    run: lineupInvite,
    formats: ['lineup invite', 'lineup invite <game1> <game2> ...'],
    descriptions: ['invite all lineups user is in', 'invite the specified lineups'],
}, {
    aliases: ['lineups ready', 'ready', 'lineup g', 'g'],
    run: lineupReady,
    formats: ['lineup ready', 'lineup ready <game1> <game2> ...'],
    descriptions: ['notify users in lineups user is in', 'invite the specified lineups'],
}, {
    aliases: ['lineup list', 'lineup', 'lineups list', 'lineups'],
    run: lineupList,
    formats: ['lineup list', 'lineup list <game1> <game2> ...',],
    descriptions: ['see the list of all game lineups', 'see the list of specified game lineups'],
}];

export const specialJoinCommand = {
    run: lineupJoin,
    formats: ['<game>'],
    descriptions: ['join the specified lineup'],
};

export default lineupCommands;
