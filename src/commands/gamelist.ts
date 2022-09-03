import { Message, MessageEmbed } from "discord.js";
import { LocalCache } from "../caches";
import { sendMessage } from '../utils';

/**
 * Function for gamelist command
 * Sends list of all available games
 * @param {Message} msg - param containing Channel object to send to
 * @param {LocalCache} cache - param containing list of available games
 */
export default function gamelist(msg : Message, cache : LocalCache) {
    const gameNames = cache.gamesCache.getGameNames();
    const gameListEmbed = new MessageEmbed()
        .setTitle('Game list')
        .addField('Current available games', gameNames.join('\n'));
    sendMessage(msg.channel, gameListEmbed);
}
