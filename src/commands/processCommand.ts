import { Client, Message } from 'discord.js';
import { LocalCache } from '../caches';
import { PREFIX } from '../common/constants';
import { sendMessageEmbed } from '../utils';
import gameCommands from './game';
import helpCommands from './help';
import lineupCommands from './lineup';

/**
 * Class for generalizing inputs to command functions
 */
export class CommandInputs {
    args : Array<string>;
    bot : Client;
    cache : LocalCache;
    command : string;
    message : Message;

    constructor (
        args : Array<string> = [],
        bot : Client = null,
        cache : LocalCache = null,
        command : string = '',
        message : Message = null,
    ) {
        this.args = args;
        this.bot = bot;
        this.cache = cache;
        this.command = command;
        this.message = message;
    }
};

const commands = [
    ...helpCommands,
    ...gameCommands,
    ...lineupCommands,
];

// No need to check for prefix in command
const getCommandRegExp = (command : string) : RegExp => new RegExp(`^${PREFIX}(${command})\\b(.*)`, 'gi');

/**
 * Process the command sent by the user (contained in msg param)
 * @param bot - Client object for discord related operations and data
 * @param cache - contains all the local cache objects 
 * @param msg - message object sent by user
 */
export default function processCommand(bot : Client, cache: LocalCache, message : Message) : void {
    const { content = '' } : { content : string } = message;
    
    let command : string = '';
    let args : Array<string> = [];

    commands.every(({ aliases, run }) => {
        for (const alias of aliases) {
            const result = getCommandRegExp(alias).exec(content);
            if (result !== null) { // check if command is valid
                command = result[1].trim();
                if (result[2].trim().length > 0) {
                    args = result[2].trim().split(' ').filter((arg) => arg.length);
                }

                const parameters = new CommandInputs(args, bot, cache, command, message);
                run(parameters);
                break;
            }
        }

        return command === '';
    });

    if (args === null) {
        sendMessageEmbed(
            message.channel,
            'Wrong command',
            `No valid command detected in \`${content}\``,
        );
    }
};
