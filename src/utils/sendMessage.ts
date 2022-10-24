import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import deleteMessage from "./deleteMessage";

const defaultOnSuccess = (sentMessage : Message) => {
    deleteMessage(sentMessage);
}

const defaultOnError = (error : any) => {
    console.log('[ERROR]', error);
};

/**
 * Send a message to a specified channel
 * @param channel - channel to send to
 * @param content - message to be sent
 * @param onSuccess - optional callback to run when message sends successfully.
 * Deletes message after `DEFAULT_MSG_TIME_DEL` (~5s) by default
 * @param onError - optional callback to run when message sends fails. Logs to console by default 
 */
export default function sendMessage(
    channel : TextChannel | DMChannel | NewsChannel,
    content : any,
    onSuccess : Function = defaultOnSuccess,
    onError : Function = defaultOnError,
) {
    channel.send(content)
        .then((sentMessage) => onSuccess(sentMessage))
        .catch((error) => onError(error));
}
