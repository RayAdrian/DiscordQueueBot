import { Message, MessageEmbed } from 'discord.js';
import { PREFIX } from '../common/constants';
import { sendMessage } from '../utils';
import gameCommands from './game';
import { CommandInputs } from './processCommand';

const getDescriptions = (commands) => {
    const collatedFormats = [];
    const collatedDescriptions = [];
    commands
        .filter(({ formats, descriptions }) => (formats?.length && descriptions?.length))
        .forEach(({ formats, descriptions }) => {
            collatedFormats.push(...formats);
            collatedDescriptions.push(...descriptions);
        });

    if (collatedFormats.length !== collatedDescriptions.length) {
        console.log('WARNING: length of collated help formats and descriptions do not match.');
    }
    return collatedFormats.map((format, index) => (
        `\`${PREFIX}${format}\`\n${collatedDescriptions[index]}`
    ));
};

const helpDescriptions = {
    'Games': getDescriptions(gameCommands),
    'Test': ['\`.help\`\nshow help commands'],
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
        .addField('Queueing Commands', 'e.g. \`.help\`');
    Object.entries(helpDescriptions).forEach(([category, commands]) => {
        helpEmbed.addField(category, commands.join('\n\n'), true);
    });
    sendMessage(message.channel, helpEmbed, () => {});
}

const helpCommands = [{
    aliases: ['help'],
    run: help,
}];

export default helpCommands;
