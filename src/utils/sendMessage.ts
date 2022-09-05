import { DMChannel, NewsChannel, TextChannel } from "discord.js";

const defaultOnError = (error : any) => {
    console.log(error);
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
    onSuccess : Function = () => {},
    onError : Function = defaultOnError,
) {
    channel.send(content)
        .then(sentMessage => onSuccess(sentMessage))
        .catch(error => onError(error));
}
