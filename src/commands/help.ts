import { Message, MessageEmbed } from "discord.js";
import { PREFIX } from "../common/constants";
import { sendMessage } from '../utils';

const descriptions = {
    'Games': [
        `\`${PREFIX}game list\` see the list of all available games`,
        `\`${PREFIX}game add <command> <role> <limit>\` add a game`,
        `\`${PREFIX}game edit <command> <role>\` edit a game's role`,
        `\`${PREFIX}game edit <command> <role> <limit>\` edit a game's role and limit`,
        `\`${PREFIX}game remove <command>\` delete a game`,
    ],
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
    sendMessage(message.channel, helpEmbed, () => {});
}
