import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { INFO_CHANNEL_ID, INFO_MSG_TIME_DEL } from "../common/constants";
import deleteMessage from "./deleteMessage";
import sendMessage from "./sendMessage";

const defaultOnSuccess = (sentMsg : Message) => deleteMessage(sentMsg, INFO_MSG_TIME_DEL);

/**
 * Send an info message
 * @param bot - contains way to retrieve info channel
 * @param info - message to be sent
 * @param onSuccess - optional callback to run when message sends successfully
 * @param onError - optional callback to run when message sends fails
 */
export default function sendInfoMessage(
    bot: Client,
    info : string,
    onSuccess : Function = defaultOnSuccess,
    onError ?: Function,
) {
    console.log('INFO: ', info);
    if (!INFO_CHANNEL_ID) {
        console.log('WARNING: No info channel id set');
        return;
    }
    const infoEmbed = new MessageEmbed()
        .setTitle('INFO')
        .addField('DateTime', new Date().toISOString())
        .addField('Message', info);
    sendMessage(
        bot.channels.cache.get(INFO_CHANNEL_ID) as TextChannel,
        infoEmbed,
        onSuccess,
        onError,
    );
}
