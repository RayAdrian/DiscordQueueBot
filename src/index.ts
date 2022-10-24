import { Client } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { LocalCache } from './caches';
import { processCommand } from './commands';
import { PREFIX } from './common/constants';
import { Lineups } from './models';
import { sendErrorMessage, sendInfoMessage } from './utils';

// For local development
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('[INFO] Hello world! Listening on port', port);
});

const bot = new Client();
const localCache = new LocalCache();

/**
 * Setup and run bot
 */
bot.on('ready', () => {
    sendInfoMessage(bot, 'Setting up bot');
    if (bot && bot.user) {
        bot.user.setActivity(".help | Sup gamers");

        mongoose.connect(process.env.DB_URL, {
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => {
            sendInfoMessage(bot, 'Connected to MongoDB. Fetching data.');
            return localCache.fetchAll();
        }).then(async (fetchData) => {
            if (fetchData && fetchData.length) {
                const { missingLineups, invalidLineups } = fetchData[0];

                if (missingLineups.length > 0) {
                    await Lineups.create(missingLineups);
                }
                
                if (invalidLineups.length > 0) {
                    const invalidLineupIds = invalidLineups.map((lineup) => lineup._id);
                    await Lineups.deleteMany({ _id: { $in: invalidLineupIds } }).exec().then(() => {
                        const invalidLineupNames = invalidLineups.map((lineup) => lineup.gameName);
                        const message = `Deleted the following lineup ids: \`${invalidLineupNames.join()}\``;
                        sendInfoMessage(bot, message, () => {});
                    });
                }
            }
            sendInfoMessage(bot, 'Bot is ready', () => {});
        }).catch((error : Error) => sendErrorMessage(bot, error));
    }
});

if (process.env.ALLOW_LEGACY_MESSAGING) {
    bot.on('message', (message) => {
        if (message.author == bot.user) { // Prevent bot from responding to its own messages
            return;
        }

        // original manual method with PREFIX ('.' by default)
        if (message.content.startsWith(PREFIX)) {
            processCommand(bot, localCache, message);
        }
    });
}

bot.login(process.env.BOT_TOKEN);
