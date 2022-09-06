import { Channel, Message, MessageEmbed, TextChannel } from "discord.js";
import { MSG_TIME_FULL_DEL } from "../common/constants";
import deleteMessage from "./deleteMessage";
import sendMessage from "./sendMessage";

const defaultOnSuccess = (sentMessage : Message) => {
    deleteMessage(sentMessage, MSG_TIME_FULL_DEL);
}

/**
 * Util function to send simple embed messages
 * @param channel
 * @param title - title for the embedded message
 * @param message - message string to be added to `Message` field
 * @param onSuccess - defaults to deleting the message after `MSG_TIME_FULL_DEL`
 * @param onError
 */
export default function sendMessageEmbed(
    channel : Channel,
    title : string,
    message : string,
    onSuccess : Function = defaultOnSuccess,
    onError ?: Function,
) {
    const messageEmbed = new MessageEmbed()
        .setTitle(title)
        .addField('Message', message);
    sendMessage(channel as TextChannel, messageEmbed, onSuccess, onError);
}