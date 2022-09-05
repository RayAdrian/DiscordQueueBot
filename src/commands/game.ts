import { Client, Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { PREFIX } from "../common/constants";
import { sendMessage } from "../utils";
import sendMessageEmbed from "../utils/sendMessageEmbed";

function gameAdd(message : Message, cache : LocalCache) {
    
}

function gameEdit(message : Message, cache : LocalCache) {
    
}

/**
 * Function for game list command
 * Sends list of all available games
 * @param message - param that contains Channel object to send to
 * @param cache - param containing list of available games
 */
function gameList(message : Message, cache : LocalCache) {
    const gameNames = cache.gamesCache.getGameNames();
    const gameListEmbed = new MessageEmbed()
        .setTitle('Game list')
        .addField('Current available games', gameNames.length ? gameNames.join('\n') : 'No games available');
    sendMessage(message.channel, gameListEmbed, () => {});
}

function gameRemove(message : Message, cache : LocalCache) {
    
}

export default function game(bot : Client, message : Message, cache : LocalCache) {
    const args = message.content.substring(PREFIX.length).split(' ');
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
}