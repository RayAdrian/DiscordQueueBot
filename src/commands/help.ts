import { Message, MessageEmbed } from 'discord.js';
import { INFO_MSG_TIME_DEL, PREFIX } from '../common/constants';
import { deleteMessage, sendMessage } from '../utils';
import gameCommands from './game';
import lineupCommands, { specialJoinCommand } from './lineup';
import { CommandInputs } from './processCommand';
import userCommands from './user';

const getDescriptions = (commands) : Array<{ name : string, description : string, simpleDescription }> => {
    return commands
        .filter(({ name, formats, descriptions }) => (name?.length && formats?.length && descriptions?.length))
        .map(({ name, aliases = ['None'], formats, descriptions }) => ({
            name,
            description: `
                *Aliases: ${aliases.join(', ')}*\n
                ${formats.map((format, index) => `\`${PREFIX}${format}\`\n${descriptions[index]}\n`).join('\n')}
                \u200b
            `,
            simpleDescription: formats.map((format, index) => `${name} ${index + 1} - \`${format}\``).join('\n'),
        }));
};

const helpDescriptions = {
    'Games': getDescriptions(gameCommands),
    'Lineups': getDescriptions([...lineupCommands, specialJoinCommand]),
    'Users': getDescriptions(userCommands),
};

/**
 * Function for the help command
 * Sends list of possible commands, a simplified one as a reply, and a comprehensive one through DM
 * @param commandInputs - contains the necessary parameters for the command
 */
function help(commandInputs : CommandInputs) {
    const { message } : { message : Message } = commandInputs;

    const simpleHelpEmbed = new MessageEmbed()
        .setTitle('GentleBot Help')
        .addField('Comprehensive Help', 'For a comprehensive help message, check your DM\'s.');
    const helpEmbed = new MessageEmbed()
        .setTitle('GentleBot Help')
        .addField('Queueing Commands', `
            Command formats listed under the aliases, highlighted like the ff. command.
            e.g. \`.help\`
        `)
        .addField('Aliases', `
            Alternate keywords for the command.
            ie. \`${PREFIX}lineup add\` = \`${PREFIX}add\`
            \u200b
        `);

    Object.entries(helpDescriptions).forEach(([category, commands]) => {
        const categoryField = `${category} Commands`;

        simpleHelpEmbed.addField(
            categoryField,
            commands.map(({ simpleDescription }) => simpleDescription).join('\n'),
        );

        helpEmbed.addField(categoryField, '\u200b');
        commands.forEach(({ name, description }) => helpEmbed.addField(name, description, true));
    });

    sendMessage(message.channel, simpleHelpEmbed, (sentMessage : Message) => {
        deleteMessage(sentMessage, INFO_MSG_TIME_DEL);
    });
    message.author.send(helpEmbed);   
}

const helpCommands = [{
    aliases: ['help'],
    run: help,
}];

export default helpCommands;
