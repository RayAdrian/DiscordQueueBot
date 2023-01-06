import { Channel, Message, MessageEmbed } from 'discord.js';
import { COLORS, ERROR_MSG_TIME_DEL, INFO_CHANNEL_ID, MEME_MSG_TIME_DEL, NOTIF_MSG_TIME_DEL, WARNING_MSG_TIME_DEL } from '../common/constants.js';
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
    | 'meme'

/**
 * Send a message to a specified channel
 * @param channel - channel to send to
 * @param message - contents to be parsed and sent
 * @param type - type of message (plain | success | information | error | warning | invite | meme)
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
    
    if (type === 'meme') {
        return sendRawMessage(
            channel,
            message,
            (msg : Message) => deleteMessage(msg, MEME_MSG_TIME_DEL),
        );
    }

    // type === 'plain'
    return sendRawMessage(channel, message);
}
