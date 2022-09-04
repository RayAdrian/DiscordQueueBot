import { Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { sendMessage } from '../utils';

/**
 * Function for gamelist command
 * Sends list of all available games
 * @param message - param that contains Channel object to send to
 * @param cache - param containing list of available games
 */
export default function gamelist(message : Message, cache : LocalCache) {
    const gameNames = cache.gamesCache.getGameNames();
    const gameListEmbed = new MessageEmbed()
        .setTitle('Game list')
        .addField('Current available games', gameNames.join('\n'));
    sendMessage(message.channel, gameListEmbed);
}
