import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { INFO_CHANNEL_ID, DEBUG_INFO_MSG_TIME_DEL, COLORS } from "../common/constants.js";
import deleteMessage from "./deleteMessage.js";
import sendRawMessage from "./sendRawMessage.js";

const defaultOnSuccess = (sentMsg : Message) => deleteMessage(sentMsg, DEBUG_INFO_MSG_TIME_DEL);

/**
 * Send an info message
 * @param bot - contains way to retrieve info channel
 * @param info - message to be sent
 * @param onSuccess - optional callback to run when message sends successfully
 * @param onError - optional callback to run when message sends fails
 */
export default function sendDebugInfoMessage(
    bot: Client,
    info : string,
    onSuccess : Function = defaultOnSuccess,
    onError ?: Function,
) {
    console.log('[INFO]', info);
    if (!INFO_CHANNEL_ID) {
        console.log('[WARNING] No info channel id set');
        return;
    }
    const infoEmbed = new MessageEmbed()
        .setTitle('INFO')
        .setColor(COLORS.DEBUG_INFO)
        .addField('DateTime', new Date().toISOString())
        .addField('Message', info);
    sendRawMessage(
        bot.channels.cache.get(INFO_CHANNEL_ID) as TextChannel,
        infoEmbed,
        onSuccess,
        onError,
    );
}
