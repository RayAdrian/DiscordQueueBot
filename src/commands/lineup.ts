
import { Client, Message } from "discord.js";
import { ALPHANUMERIC, PREFIX, READY_MESSAGE } from "../common/constants.js";
import ServiceProvider from '../services/serviceProvider.js';
import { isValidUser, sendDebugErrorMessage, sendMessage } from '../utils/index.js';
import { CommandInputs } from './processCommand.js';

/**
 * Worker function to check for complete lineups
 * @param commandInputs - contains cache to fetch lineups
 * @param gameNames - list of games to check
 */
async function completeLineupWorker(
    commandInputs : CommandInputs, gameNames : Array<string>,
) {
    const { message, serviceProvider } : { message : Message, serviceProvider : ServiceProvider } = commandInputs;
    const { lineupService } = serviceProvider;

    const completedLineupsStrings = [];
    const fullLineups = await lineupService.getFullLineups(gameNames);

    fullLineups.forEach((lineup) => {
        completedLineupsStrings.push(`${lineup.getGameName().toLocaleUpperCase()} Lineup Complete: ${lineup.getUsers().join(' ')}`);
    });
    if (completedLineupsStrings.length > 0) {
        sendMessage(message.channel, completedLineupsStrings.join('\n'), 'invite');
    }
}

/**
 * Function for `lineup list` / `lineup list <game/s>` commands
 * Sends list of all lineups
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupList(commandInputs : CommandInputs) {
    const { args, message, serviceProvider } : {
        args : Array<string>, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());

    // check if lineup list has specified games
    if (
        gameNames.length === 0
        || (gameNames.length === 1 && gameNames[0] === 'all')
    ) { // list all non-empty lineups
        lineupService.getLineups().then((lineups) => {
            return lineups
                .filter((lineup) => lineup.getUserCount() > 0)
                .sort((lineupA, lineupB) => lineupA.getGameName().localeCompare(lineupB.getGameName()));
        }).then((lineups) => {
            if (lineups.length > 0) {
                const content = {};
                lineups.forEach((lineup) => {
                    const capitalisedGameName = lineup.getGameName().toLocaleUpperCase();
                    const gameLineupsString = lineup.getUserCount() ? `${lineup.getUsers().join(' ')}` : '\`No players in lineup\`';
                    content[capitalisedGameName] = gameLineupsString;
                }) 
                sendMessage(message.channel, content, 'information', 'Lineup List');
            } else {
                const content = { 'Notification': 'All lineups empty.' };
                sendMessage(message.channel, content, 'information', 'Lineup List')
            }
        })
    } else if (gameNames.length > 0) { // list specified lineups
        // validation
        const errorMessages = []; 
        const storedGameNames = await gameService.getGameNames();

        gameNames.forEach((gameName) => {
            if (!storedGameNames.includes(gameName)) {
                errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
            }
        })

        if (errorMessages.length) {
            const content = { 'Invalid arguments': errorMessages.join('\n') };
            sendMessage(message.channel, content, 'error', 'Lineup List');
            return;
        }
    
        // arguments validated
        const uniqueGameNames = Array(...new Set(gameNames));
        lineupService.getFilteredLineups(uniqueGameNames).then((lineups) => {
            const content = {};

            if (lineups.length === 1) {
                const lineup = lineups[0];
                const capitalisedGameName = lineup.getGameName().toLocaleUpperCase();
                const gameLineupsString = lineup.getUserCount() ? `${lineup.getUsers().join('\n')}` : '\`No players in lineup\`';
                content[capitalisedGameName] = gameLineupsString;
            } else {
                lineups.forEach((lineup) => {
                    const capitalisedGameName = lineup.getGameName().toLocaleUpperCase();
                    const gameLineupsString = lineup.getUserCount() ? `${lineup.getUsers().join(' ')}` : '\`No players in lineup\`';
                    content[capitalisedGameName] = gameLineupsString;
                });
            }

            sendMessage(message.channel, content, 'information', 'Lineup List');
        });
    }
}

/**
 * Function to handle `lineup add <game> <user id/s>`
 * Add the user to the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupAdd(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount < 2) {
        const content = {
            'Unexpected number of arguments': `Expecting at least 2 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.lineup add <game> <user id/s>\`',
        };
        sendMessage(message.channel, content, 'error', 'Lineup Add');
        return;
    }

    const [gameName, ...users] = args.map(arg => arg?.trim()?.toLowerCase());
    const storedGameNames = await gameService.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (!storedGameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
    }
    users.filter(
        (user) => !isValidUser(user),
    ).forEach((user) => errorMessages.push(`Invalid user \`${user}\`.`));
    // TODO: Add sending user role validation

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Lineup Add');
        return;
    }

    // arguments validated
    lineupService.addUsers(gameName, users).then(({
        validUsers, invalidUsers, excludedUsers,
    }) => {
        const content = {};

        if (invalidUsers.length) {
            content['Following users already in the lineup'] = invalidUsers.join(' ');
        }

        if (excludedUsers.length > 0) {
            content['Cannot add the following users. Exceeds limit.'] = excludedUsers.join(' ');
        }

        if (validUsers.length) {
            content['Successfully added the following users'] = validUsers.join(' ');
                
            completeLineupWorker(commandInputs, [gameName]);
            sendMessage(message.channel, content, 'success', `Lineup Add - ${gameName}`);
        } else {
            content['No users added'] = 'No valid users';
            sendMessage(message.channel, content, 'warning', `Lineup Add - ${gameName}`);
        }        
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', `Lineup Add - ${gameName}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `lineup join <game/s>`
 * Add the user that sent the message to the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupJoin(commandInputs : CommandInputs) {
    const {
        args, bot, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService, userService } = serviceProvider;

    const argsCount = args.length;
    const userId = `<@${message.author.id}>`;
    const username = `<@${message.author.username}>`;
    let gameNames = argsCount === 0
        ? await userService.getUserGames(userId)
        : Array(...new Set(args.map(arg => arg?.trim()?.toLowerCase())));

    // blocking game args validation
    if (argsCount > 0) {
        const isJoinAll = gameNames.length === 1 && gameNames[0] === 'all';
        const errorMessages = [];
        const storedGameNames = await gameService.getGameNames();

        if (!isJoinAll) { // validate game names
            gameNames.forEach((gameName) => {
                if (!ALPHANUMERIC.test(gameName)) {
                    errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
                } else if (!storedGameNames.includes(gameName)) {
                    errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
                }
            });
        }

        if (errorMessages.length) {
            const content = { 'Invalid arguments': errorMessages.join('\n') };
            sendMessage(message.channel, content, 'error', `Lineup Join - ${username}`);
            return;
        }

        if (isJoinAll) {
            gameNames = storedGameNames;
        }
    }

    // arguments validated
    lineupService.joinLineups(userId, gameNames).then(({
        fullGameNames, invalidGameNames, validGameNames,
    }) => {
        const content = {};

        if (fullGameNames.length) {
            content['Following lineups are already full'] = fullGameNames.join(' ');
        }

        if (invalidGameNames.length) {
            content['User is already in the following lineups'] = invalidGameNames.join(' ');
        }
    
        if (validGameNames.length) {
            content['Successfully added the user to the following lineups'] = validGameNames.join(' ');

            completeLineupWorker(commandInputs, validGameNames);
            sendMessage(message.channel, content, 'success', `Lineup Join - ${username}`);
        } else {
            content['User not added to any lineup'] = 'No valid lineup';
            sendMessage(message.channel, content, 'warning', `Lineup Join - ${username}`);
        }     
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', `Lineup Join - ${username}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `lineup kick <game> <user id>`
 * Remove the user from the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupKick(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount < 2) {
        const content = {
            'Unexpected number of arguments': `Expecting at least 2 arguments for \`${PREFIX}${command}\`. Received ${argsCount}.`,
            'Expected Format/s': '\`.lineup kick <game> <user id>\`',
        };
        sendMessage(message.channel, content, 'error', 'Lineup Kick');
        return;
    }

    const [gameName, ...users] = args.map(arg => arg?.trim()?.toLowerCase());
    const storedGameNames = await gameService.getGameNames();
    const errorMessages = [];

    if (!ALPHANUMERIC.test(gameName)) {
        errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
    } else if (!storedGameNames.includes(gameName)) {
        errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
    }
    users.filter(
        (user) => !isValidUser(user),
    ).forEach((user) => errorMessages.push(`Invalid user \`${user}\`.`));
    // TODO: Add sending user role validation

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Lineup Kick');
        return;
    }

    // arguments validated
    lineupService.removeUsers(gameName, users).then(({
        validUsers, invalidUsers,
    }) => {
        const content = {};

        if (invalidUsers.length) {
            content['Following users not in the lineup'] = invalidUsers.join(' ');
        }

        if (validUsers.length) {
            content['Successfully kicked the following users'] = validUsers.join(' ');
                
            completeLineupWorker(commandInputs, [gameName]);
            sendMessage(message.channel, content, 'success', `Lineup Kick - ${gameName}`);
        } else {
            content['No users kicked'] = 'No valid users';
            sendMessage(message.channel, content, 'warning', `Lineup Kick - ${gameName}`);
        }        
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', `Lineup Kick - ${gameName}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `lineup leave` / `lineup leave <game/s>` commands
 * Remove the user either from all their lineups, or from specified lineups
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupLeave(commandInputs : CommandInputs) {
    const {
        args, bot, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    const userId = `<@${message.author.id}>`;
    const username = `<@${message.author.username}>`;
    const argsCount = args.length;
    const isSpecifiedLeave = argsCount > 0;
    let gameNames = isSpecifiedLeave
        ? args.map(arg => arg?.trim()?.toLowerCase())
        : [];

    // blocking game args validation
    const errorMessages = [];

    if (isSpecifiedLeave) { // leave specified games
        const isAll = gameNames.length === 1 && gameNames[0] === 'all';

        if (!isAll) {
            // validate game names
            const storedGameNames = await gameService.getGameNames();
            gameNames.forEach((gameName) => {
                if (!ALPHANUMERIC.test(gameName)) {
                    errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
                } else if (!storedGameNames.includes(gameName)) {
                    errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
                }
            });
        }

        if (isAll) { // treat the same as leaving all (only) the lineups the user is in
            gameNames = [];
        }
    }

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', `Lineup Leave - ${username}`);
        return;
    }

    // arguments validated
    lineupService.leaveLineups(userId, gameNames).then(({
        invalidGameNames, validGameNames,
    }) => {
        const content = {};

        if (invalidGameNames.length) {
            content['User is not in the following lineups'] = invalidGameNames.join(' ');
        }
    
        if (validGameNames.length) {
            content['Successfully removed the user from the following lineups'] = validGameNames.join(' ');

            completeLineupWorker(commandInputs, validGameNames);
            sendMessage(message.channel, content, 'success', `Lineup Leave - ${username}`);
        } else {
            content['User not removed from any lineup'] = 'No valid lineup';
            sendMessage(message.channel, content, 'warning', `Lineup Leave - ${username}`);
        }     
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', `Lineup Join - ${username}`);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `lineup reset` / `lineup reset <game/s>` commands
 * Remove the user from the game's lineup
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupReset(commandInputs : CommandInputs) {
    const {
        args, message, serviceProvider,
    } : {
        args : Array<string>,message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    // validation
    const errorMessages = []; 
    // TODO: Add sending user role validation

    const gameNames = args.map(arg => arg?.trim()?.toLowerCase());
    const storedGameNames = await gameService.getGameNames();

    gameNames.forEach((gameName) => {
        if (!storedGameNames.includes(gameName)) {
            errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
        }
    })

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Lineup Reset');
        return;
    }

    // arguments validated
    const uniqueGameNames = Array(...new Set(gameNames));
    lineupService.resetLineups(uniqueGameNames).then((resetGameNames) => {
        if (resetGameNames.length) {
            const fieldTitle = 'The following lineups have been reset';
            const content = { [fieldTitle]: `\`${resetGameNames.join('\n')}\`` };
            sendMessage(message.channel, content, 'success', 'Lineup Reset');
        } else {
            const content = { 'Notification': 'No lineup has been reset.' };
            sendMessage(message.channel, content, 'warning', 'Lineup Reset');
        }
    });
}

/**
 * Function to handle `lineup invite` / `lineup invite <game/s>` commands
 * Send invites for lineups depending on command args (or lack thereof)
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupInvite(commandInputs : CommandInputs) {
    const {
        args, bot, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    const userId = `<@${message.author.id}>`;
    const argsCount = args.length;
    const isSpecifiedInvite = argsCount > 0;
    const gameNames = isSpecifiedInvite
        ? args.map(arg => arg?.trim()?.toLowerCase())
        : [];

    // blocking game args validation
    const errorMessages = [];

    if (isSpecifiedInvite) { // invite specified games
        const isAll = gameNames.length === 1 && gameNames[0] === 'all';

        if (!isAll) {
            // validate game names
            const storedGameNames = await gameService.getGameNames();
            gameNames.forEach((gameName) => {
                if (!ALPHANUMERIC.test(gameName)) {
                    errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
                } else if (!storedGameNames.includes(gameName)) {
                    errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
                }
            });
        }
    }

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Lineup Invite');
        return;
    }

    // arguments validated
    const uniqueGameNames = Array(...new Set(gameNames));
    lineupService.inviteLineups(userId, uniqueGameNames).then(({
        fullGamesMessage, inviteMessage,
    }) => {
        const content = {};

        if (fullGamesMessage) {
            content['Following lineups are already full'] = fullGamesMessage;
        }

        if (inviteMessage) {
            sendMessage(message.channel, inviteMessage, 'invite');
        } else {
            content['Notification'] = 'No lineups to be invited';
        }

        if (Object.values(content).length > 0) {
            sendMessage(message.channel, content, 'warning', 'Lineup Invite');
        }
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', 'Lineup Invite');
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Function to handle `lineup ready` / `lineup ready <game/s>` commands
 * Notify people in lineups that it is ready
 * @param commandInputs - contains the necessary parameters for the command
 */
async function lineupReady(commandInputs : CommandInputs) {
    const {
        args, bot, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { gameService, lineupService } = serviceProvider;

    const userId = `<@${message.author.id}>`;
    const argsCount = args.length;
    const isSpecifiedReady = argsCount > 0;
    const gameNames = isSpecifiedReady
        ? args.map(arg => arg?.trim()?.toLowerCase())
        : [];

    // blocking game args validation
    const errorMessages = [];

    if (isSpecifiedReady) { // ping ready specified games
        const isAll = gameNames.length === 1 && gameNames[0] === 'all';
        
        if (!isAll) {
            // validate game names
            const storedGameNames = await gameService.getGameNames();
            gameNames.forEach((gameName) => {
                if (!ALPHANUMERIC.test(gameName)) {
                    errorMessages.push('Invalid game name. Should only consist of alphanumeric characters.');
                } else if (!storedGameNames.includes(gameName)) {
                    errorMessages.push(`Invalid game name. Cannot find the game \`${gameName}\`.`);
                }
            });
        }
    }

    if (errorMessages.length) {
        const content = { 'Invalid arguments': errorMessages.join('\n') };
        sendMessage(message.channel, content, 'error', 'Lineup Ready');
        return;
    }

    // info messages and actual cache operations
    const uniqueGameNames = Array(...new Set(gameNames));
    lineupService.readyLineups(userId, uniqueGameNames).then(({
        invalidGameNames, validLineups,
    }) => {
        const content = {};

        if (invalidGameNames.length) {
            content['No users in the following lineups'] = `${invalidGameNames.join(' ')}`;
        }

        if (validLineups.length) {
            const readyMessages = [];
            validLineups.forEach((lineup) => {
                const gameName = lineup.getGameName();
                readyMessages.push(
                    `${READY_MESSAGE} ${gameName.toLocaleUpperCase()} : ${lineup.getUsers().join(' ')} `,
                );
            });

            const readyMessage = readyMessages.length ? readyMessages.join('\n') : null;
            sendMessage(message.channel, readyMessage, 'invite');
        } else {
            content['Notification'] = 'No lineups ready';
        }

        if (Object.values(content).length > 0) {
            sendMessage(message.channel, content, 'warning', 'Lineup Ready');
        }
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', 'Lineup Ready');
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}


/**
 * Commands for lineups
 */
const lineupCommands = [{
    name: 'Lineup Add',
    aliases: ['lineup add', 'add', 'lineups add'],
    run: lineupAdd,
    formats: ['add <game> <user id>'],
    descriptions: ['add a user to a game\'s lineup'],
}, {
    name: 'Lineup Join',
    aliases: ['lineup join', 'join', 'lineups join'],
    run: lineupJoin,
    formats: ['join <game>'],
    descriptions: ['add the user that sent the message to a game\'s lineup'],
}, {
    name: 'Lineup Kick',
    aliases: ['lineup kick', 'kick', 'lineups kick'],
    run: lineupKick,
    formats: ['kick <game>'],
    descriptions: ['remove a user from a game\'s lineup'],
}, {
    name: 'Lineup Leave',
    aliases: ['lineup leave', 'leave', 'lineups leave'],
    run: lineupLeave,
    formats: ['leave', 'leave <game1> <game2> ...'],
    descriptions: ['leave all lineups user is in', 'leave the specified lineups'],
},  {
    name: 'Lineup Reset',
    aliases: ['lineup reset', 'reset', 'lineups reset'],
    run: lineupReset,
    formats: ['reset', 'reset <game1> <game2> ...'],
    descriptions: ['reset all lineups', 'reset the specified lineups'],
}, {
    name: 'Lineup Invite',
    aliases: ['lineup invite', 'invite', 'lineups invite'],
    run: lineupInvite,
    formats: ['invite', 'invite <game1> <game2> ...'],
    descriptions: ['invite all lineups user is in', 'invite the specified lineups'],
}, {
    name: 'Lineup Ready',
    aliases: ['lineup ready', 'ready', 'lineups ready', 'lineup g', 'g', 'lineups g'],
    run: lineupReady,
    formats: ['ready', 'ready <game1> <game2> ...'],
    descriptions: ['notify users in lineups user is in', 'tag the specified lineups'],
}, {
    name: 'Lineup List',
    aliases: ['lineup list', 'lineup', 'lineups list', 'lineups'],
    run: lineupList,
    formats: ['lineups', 'lineups <game1> <game2> ...',],
    descriptions: ['see the list of all game lineups', 'see the list of specified game lineups'],
}];

export const specialJoinCommand = {
    name: 'Special Lineup Join',
    run: lineupJoin,
    formats: ['<game>'],
    descriptions: ['join the specified game\'s lineup'],
};

export default lineupCommands;
