import { Channel, MessageEmbed, TextChannel } from "discord.js";
import sendMessage from "./sendMessage";

/**
 * Util function to send simple embed messages
 * @param channel
 * @param title
 * @param message
 */
export default function sendMessageEmbed (channel : Channel, title : string, message : string) {
    const messageEmbed = new MessageEmbed()
        .setTitle(title)
        .addField('Message', message);
    sendMessage(channel as TextChannel, messageEmbed);
}