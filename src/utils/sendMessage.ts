import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { MSG_TIME_DEL } from "../common/constants";
import deleteMessage from "./deleteMessage";

const defaultOnSuccess = (sentMessage : Message) => {
    deleteMessage(sentMessage, MSG_TIME_DEL);
}

const defaultOnError = (error : any) => {
    console.log('ERROR: ', error);
};

/**
 * Send a message to a specified channel
 * @param channel - channel to send to
 * @param content - message to be sent
 * @param onSuccess - optional callback to run when message sends successfully
 * @param onError - optional callback to run when message sends fails. Logs to console by default 
 */
export default function sendMessage(
    channel : TextChannel | DMChannel | NewsChannel,
    content : any,
    onSuccess : Function = defaultOnSuccess,
    onError : Function = defaultOnError,
) {
    channel.send(content)
        .then(sentMessage => onSuccess(sentMessage))
        .catch(error => onError(error));
}
