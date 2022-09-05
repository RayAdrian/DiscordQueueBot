import { Client, Message } from 'discord.js';
import { LocalCache } from '../caches';
import { PREFIX } from "../common/constants";
import sendMessageEmbed from '../utils/sendMessageEmbed';
import gameAdd from './gameAdd';
import gameEdit from './gameEdit';
import gameList from './gameList';
import gameRemove from './gameRemove';
import help from './help';

/**
 * Process the command sent by the user (contained in msg param)
 * @param bot - Client object for discord related operations and data
 * @param cache - contains all the local cache objects 
 * @param msg - message object sent by user
 */
export default function processCommand(bot : Client, cache: LocalCache, message : Message) : void {
    const args = message.content.substring(PREFIX.length).split(' ');
    const command = args[0]?.toLowerCase();

    switch(command) {
        case 'help':
            help(message);
            break;
        case 'game':
            const subCommand = args[1]?.toLowerCase();
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
                case null:
                case '':
                    sendMessageEmbed(
                        message.channel,
                        'Wrong command',
                        'Wrong usage of \`game\` command',
                    );
                    break;
            }
            break;
        default:
            sendMessageEmbed(
                message.channel,
                'Wrong command',
                `Command \`${command}\` does not exist.`,
            );
    }
};
