import { Channel, Message, MessageEmbed } from 'discord.js';
import { COLORS, ERROR_MSG_TIME_DEL, INFO_CHANNEL_ID, NOTIF_MSG_TIME_DEL, WARNING_MSG_TIME_DEL } from '../common/constants.js';
import deleteMessage from './deleteMessage.js';
import sendRawMessage from './sendRawMessage.js';

const addFields = (messageEmbed : MessageEmbed, description : string | Object) => {
    if (typeof description === 'string') {
        messageEmbed.addField('Message', description);
    } else {
        Object.entries(description).forEach(([title, contents]) => {
            messageEmbed.addField(title, contents);
        })
    }
};

type types = 'plain'
    | 'success'
    | 'information'
    | 'error'
    | 'warning'
    | 'invite'

/**
 * Send a message to a specified channel
 * @param channel - channel to send to
 * @param message - contents to be parsed and sent
 * @param type - type of message
 * @param title - if present and applicable, title of the embedded message
 */
export default function sendMessage(
    channel : Channel,
    message : string | Object,
    type: types,
    title ?: string,
) : Promise<Message> {
    let embed: MessageEmbed;
    
    if (type === 'success') {
        embed = new MessageEmbed()
          .setColor(COLORS.SUCCESS)
          .setTitle(title || 'Notification');
        addFields(embed, message);
        return sendRawMessage(
            channel,
            embed,
            (msg : Message) => deleteMessage(msg, NOTIF_MSG_TIME_DEL),
        );
    }

    if (type === 'information') {
        embed = new MessageEmbed()
          .setColor(COLORS.INFORMATION)
          .setTitle(title || 'Information');
        addFields(embed, message);
        return sendRawMessage(channel, embed, () => {});
    }
    
    if (type === 'error') {
        embed = new MessageEmbed()
          .setColor(COLORS.ERROR)
          .setTitle(title || 'Error');
        addFields(embed, message);
        return sendRawMessage(
            channel,
            embed,
            (msg : Message) => deleteMessage(msg, ERROR_MSG_TIME_DEL),
        );
    }
    
    if (type === 'warning') {
        embed = new MessageEmbed()
          .setColor(COLORS.WARNING)
          .setTitle(title || 'Warning');
        addFields(embed, message);
        return sendRawMessage(
            channel,
            embed,
            (msg : Message) => deleteMessage(msg, WARNING_MSG_TIME_DEL),
        );
    }
    
    if (type === 'invite') {
        return sendRawMessage(channel, message, () => {});
    }

    // type === 'plain'
    return sendRawMessage(channel, message);
}
