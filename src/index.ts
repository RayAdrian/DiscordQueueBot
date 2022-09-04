import { Client, Message, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { LocalCache } from './caches';
import { processCommand } from './commands';
import { INFO_MSG_TIME_DEL, PREFIX } from './common/constants';
import { deleteMessage, sendMessage } from './utils';

// For local development
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Hello world listening on port', port);
});

const bot = new Client();
const localCache = new LocalCache();

/**
 * Setup and run bot
 */
bot.on('ready', () => {
    console.log('Bot is online');
    if (bot && bot.user) {
        bot.user.setActivity(".help | Sup gamers");
        sendMessage(
            bot.channels.cache.get(process.env.INFO_CHANNEL_ID) as TextChannel,
            'Bot is online',
            (sentMessage : Message) => deleteMessage(sentMessage, INFO_MSG_TIME_DEL),
        );
    }

    mongoose.connect(process.env.DB_URL).then(() => {
        console.log('Connected to MongoDB');
        sendMessage(
            bot.channels.cache.get(process.env.INFO_CHANNEL_ID) as TextChannel,
            'Connected to MongoDB',
            (sentMsg : Message) => deleteMessage(sentMsg, INFO_MSG_TIME_DEL),
        );
        localCache.fetch();
    });
});

bot.on('message', (message) => {
    if (message.author == bot.user) { // Prevent bot from responding to its own messages
        return;
    }

    if (message.content.startsWith(PREFIX)) {
        processCommand(localCache, message);
    }
});

bot.login(process.env.BOT_TOKEN);
