import { Client } from 'discord.js';
import express from 'express';
import mongoose from 'mongoose';
import { LocalCache } from './caches';
import processCommand from './commands';
import { PREFIX } from './common/constants';

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
    }

    mongoose.connect(process.env.DB_URL || '').then(() => {
        console.log('Connected to MongoDB');
        localCache.fetch();
        console.log('localCache', localCache);
    });
});

bot.on('message', (msg) => {
    if (msg.author == bot.user) { // Prevent bot from responding to its own messages
        return;
    }

    if (msg.content.startsWith(PREFIX)) {
        processCommand(localCache, msg);
    }
});

bot.login(process.env.BOT_TOKEN);
