import { Client } from 'discord.js';
import { Message } from 'discord.js';
import { COPYPASTA_COOLDOWN, COPYPASTA_DELAY } from '../common/constants.js';
import { CLUB_PENGUIN } from '../common/copypastas.js';
import ServiceProvider from '../services/serviceProvider.js';
import sendDebugErrorMessage from '../utils/sendDebugErrorMessage.js';
import sendMessage from '../utils/sendMessage.js';
import { CommandInputs } from './processCommand.js';

/**
 * Function to handle hidden command `.♣️🐧`
 * Respond with the `Club Penguin` copypasta
 * @param commandInputs - contains the necessary parameters for the command
 */
function clubPenguin(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { cooldownService } = serviceProvider;

    // validation
    const argsCount = args.length;
    if (argsCount !== 0) {
        // return nothing
        return;
    }

    // check if in cooldown
    const userId = `<@${message.author.id}>`;
    const commandKey = 'club penguin';

    cooldownService.getCooldown(userId, commandKey).then((endCooldown) => {
        const now = new Date();
        if (endCooldown && endCooldown > now) {
            const remainingDuration = ((endCooldown.getTime() - now.getTime()) / 1000).toFixed(0);
            const content = {
                'Command Cooldown': `.\`${command}\` is in cooldown for ${remainingDuration} more seconds.`,
            };
            sendMessage(message.channel, content, 'error', command);
            return;
        }
    
        // set cooldown
        return cooldownService.addCooldown(userId, commandKey, COPYPASTA_COOLDOWN).then(() => {
            // send copypasta line per line with delay
            CLUB_PENGUIN.split('\n').forEach((line, index) => {
                const delay = COPYPASTA_DELAY * index;
                setTimeout(() => sendMessage(message.channel, line, 'meme'), delay);
            });
        });
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', command);
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}

/**
 * Hidden Commands
 */
const hiddenCommands = [{
    name: 'Club Penguin',
    aliases: ['♣️🐧'],
    run: clubPenguin,
    formats: ['♣️🐧'],
    descriptions: ['Respond with the `Club Penguin` copypasta'],
}];

export default hiddenCommands;
