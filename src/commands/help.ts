import { Message, MessageEmbed } from 'discord.js';
import { PREFIX } from '../common/constants';
import { sendMessage } from '../utils';
import gameCommands from './game';
import lineupCommands, { specialJoinCommand } from './lineup';
import { CommandInputs } from './processCommand';
import userCommands from './user';

const getDescriptions = (commands) : Array<{ name : string, value : string }> => {
    return commands
        .filter(({ name, formats, descriptions }) => (name?.length && formats?.length && descriptions?.length))
        .map(({ name, aliases, formats, descriptions }) => ({
            name,
            value: `
                *Aliases: ${aliases.join(', ')}*\n
                ${formats.map((format, index) => `\`${PREFIX}${format}\`\n${descriptions[index]}\n`).join('\n')}
            `,
        }));
};

const helpDescriptions = {
    'Games': getDescriptions(gameCommands),
    'Lineups': getDescriptions([...lineupCommands, specialJoinCommand]),
    'Users': getDescriptions(userCommands),
};

/**
 * Function for the help command
 * Sends list of possible commands each with description/s
 * @param parameters - contains the necessary parameters for the command
 */
function help(commandInputs : CommandInputs) {
    const { message } : { message : Message } = commandInputs;

    const helpEmbed = new MessageEmbed()
        .setTitle('GentleBot Help')
        .addField('Queueing Commands', 'e.g. \`.help\`')
        .addField('Aliases', `
            Alternate keywords for the command.
            ie. \`${PREFIX}lineup add\` = \`${PREFIX}add\`
        `);

    Object.entries(helpDescriptions).forEach(([category, commands]) => {
        helpEmbed.addField(`\u200b\n${category} Commands`, '\u200b');
        commands.forEach(({ name, value }) => {
            helpEmbed.addField(name, value, true);
        });
    });

    sendMessage(message.channel, helpEmbed, () => {});
}

const helpCommands = [{
    aliases: ['help'],
    run: help,
}];

export default helpCommands;
