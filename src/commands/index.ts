import { Message } from 'discord.js';
import { LocalCache } from '../caches';
import { PREFIX } from "../common/constants";
import gamelist from './gamelist';
import help from './help';

/**
 * Process the command sent by the user (contained in msg param)
 * @param {LocalCache} cache - contains all the local cache objects 
 * @param {Message} msg - message object sent by user
 */
function processCommand (cache: LocalCache, msg : Message) : void{
    const args = msg.content.substring(PREFIX.length).split(' ');
    const command = args[0].toLowerCase();

    switch(command) {
        case 'help':
            help(msg);
            break;
        case 'gamelist':
            gamelist(msg, cache);
            break;
    }
};

export default processCommand;
