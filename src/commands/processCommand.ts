import { Client, Message } from 'discord.js';
import { LocalCache } from '../caches/index.js';
import { PREFIX } from '../common/constants.js';
import { sendMessageEmbed } from '../utils/index.js';
import gameCommands from './game.js';
import helpCommands from './help.js';
import lineupCommands, { specialJoinCommand } from './lineup.js';
import userCommands from './user.js';

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
    ...userCommands,
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
    const cleanedContent = content.trim();

    let isValidCommand = commands.some(({ aliases, run }) => {
        for (const alias of aliases) {
            const result = getCommandRegExp(alias).exec(cleanedContent);
            if (result !== null) { // check if command is valid
                const command = result[1].trim();
                const args = result[2].trim().split(' ').filter((arg) => arg.length);

                const parameters = new CommandInputs(args, bot, cache, command, message);
                run(parameters);
                return true;
            }
        }

        return false;
    });

    if (!isValidCommand) { // test for special game name join command
        const { run } = specialJoinCommand;
        const aliases = cache.getGameNames();

        isValidCommand = aliases.some((alias) => {
            if (cleanedContent.localeCompare(`${PREFIX}${alias}`) === 0) { // check if command matches
                const command = 'lineup join';
                const args = [alias];

                const parameters = new CommandInputs(args, bot, cache, command, message);
                run(parameters);
                return true;
            }

            return false;
        })
    }

    if (!isValidCommand) { // no valid command
        sendMessageEmbed(
            message.channel,
            'Wrong command',
            `No valid command detected in \`${cleanedContent}\``,
        );
    }
};
