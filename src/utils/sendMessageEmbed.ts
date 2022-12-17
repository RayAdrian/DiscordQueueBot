import { Channel, Message, MessageEmbed, TextChannel } from "discord.js";
import { INFO_MSG_TIME_DEL } from "../common/constants.js";
import deleteMessage from "./deleteMessage.js";
import sendMessage from "./sendMessage.js";

const defaultOnSuccess = (sentMessage : Message) => {
    deleteMessage(sentMessage, INFO_MSG_TIME_DEL);
}

/**
 * Util function to send simple embed messages
 * @param channel
 * @param title - title for the embedded message
 * @param message - message string to be added to `Message` field
 * @param onSuccess - defaults to deleting the message after `INFO_MSG_TIME_DEL`
 * @param onError
 */
export default function sendMessageEmbed(
    channel : Channel,
    title : string,
    message : string | Object,
    onSuccess : Function = defaultOnSuccess,
    onError ?: Function,
) {
    const messageEmbed = new MessageEmbed().setTitle(title)
    if (typeof message === 'string') {
        messageEmbed.addField('Message', message);
    } else {
        Object.entries(message).forEach(([title, contents]) => {
            messageEmbed.addField(title, contents);
        })
    }
    sendMessage(channel as TextChannel, messageEmbed, onSuccess, onError);
}