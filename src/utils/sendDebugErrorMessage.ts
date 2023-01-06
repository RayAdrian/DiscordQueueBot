import { Client, MessageEmbed, TextChannel } from "discord.js";
import { COLORS, ERROR_CHANNEL_ID } from "../common/constants.js";
import sendRawMessage from "./sendRawMessage.js";

/**
 * Send an error message
 * @param bot - contains way to retrieve error channel
 * @param error - error to be sent
 * @param onSuccess - optional callback to run when message sends successfully
 * @param onError - optional callback to run when message sends fails
 */
export default function sendDebugErrorMessage(
    bot: Client,
    error : Error,
    onSuccess : Function = () => {},
    onError ?: Function,
) {
    console.log('[ERROR]', error);
    if (!ERROR_CHANNEL_ID) {
        console.log('[WARNING] No error channel id set');
        return;
    }
    const errorEmbed = new MessageEmbed()
        .setTitle('ERROR')
        .setColor(COLORS.DEBUG_ERROR)
        .addField('DateTime', new Date().toISOString())
        .addField('Message', error.toString());
    sendRawMessage(
        bot.channels.cache.get(ERROR_CHANNEL_ID) as TextChannel,
        errorEmbed,
        onSuccess,
        onError,
    );
}
