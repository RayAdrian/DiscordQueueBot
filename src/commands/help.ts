import { Message, MessageEmbed } from "discord.js";
import { sendMessage } from '../utils';

const descriptions = {
    'Game List': ['.gamelist to see the list of all available games'],
};

/**
 * Function for the help command
 * Sends list of possible commands each with description/s
 * @param message - param that contains Channel object to send to
 */
export default function help(message : Message) {
    const helpEmbed = new MessageEmbed()
        .setTitle('GentleBot Help')
        .addField('Queueing Commands', 'e.g. .help');
    Object.entries(descriptions).forEach(([command, subCommands]) => {
        helpEmbed.addField(command, subCommands.join('\n'));
    });
    sendMessage(message.channel, helpEmbed);
}
