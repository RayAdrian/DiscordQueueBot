import { Message } from 'discord.js';
import { COPYPASTA_DELAY } from '../common/constants.js';
import { CLUB_PENGUIN } from '../common/copypastas.js';
import sendMessage from '../utils/sendMessage.js';
import { CommandInputs } from './processCommand.js';

/**
 * Function to handle hidden command `.♣️🐧`
 * Respond with the `Club Penguin` copypasta
 * @param commandInputs - contains the necessary parameters for the command
 */
function clubPenguin(commandInputs : CommandInputs) {
    const {
        args, message,
    } : {
        args : Array<string>, message : Message,
    } = commandInputs;

    // validation
    const argsCount = args.length;
    if (argsCount !== 0) {
        // return nothing
        return;
    }

    // send copypasta line per line with delay
    CLUB_PENGUIN.split('\n').forEach((line, index) => {
        const delay = COPYPASTA_DELAY * (index - 1);
        setTimeout(() => sendMessage(message.channel, line, 'plain'), delay);
    });
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
