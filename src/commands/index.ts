import { Message } from 'discord.js';
import { LocalCache } from '../caches';
import { PREFIX } from "../common/constants";
import gamelist from './gamelist';
import help from './help';

/**
 * Process the command sent by the user (contained in msg param)
 * @param cache - contains all the local cache objects 
 * @param msg - message object sent by user
 */
export function processCommand (cache: LocalCache, message : Message) : void {
    const args = message.content.substring(PREFIX.length).split(' ');
    const command = args[0].toLowerCase();

    switch(command) {
        case 'help':
            help(message);
            break;
        case 'gamelist':
            gamelist(message, cache);
            break;
    }
};
