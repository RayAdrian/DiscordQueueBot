import { Message, MessageEmbed } from 'discord.js';
import { COLORS, PREFIX } from '../common/constants.js';
import { sendRawMessage } from '../utils/index.js';
import gameCommands from './game.js';
import lineupCommands, { specialJoinCommand } from './lineup.js';
import { CommandInputs } from './processCommand.js';
import userCommands from './user.js';

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
        .setColor(COLORS.INFORMATION)
        .addField('Comprehensive Help', 'For a comprehensive help message, check your DM\'s.');
    const helpEmbed = new MessageEmbed()
        .setTitle('GentleBot Help')
        .setColor(COLORS.INFORMATION)
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

    sendRawMessage(message.channel, simpleHelpEmbed, () => {});
    message.author.send(helpEmbed);   
}

const helpCommands = [{
    aliases: ['help'],
    run: help,
}];

export default helpCommands;
