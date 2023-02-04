import { Client, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { LocalCache } from './caches/index.js';
import { processCommand } from './commands/index.js';
import { MAIN_CHANNEL_ID, PREFIX, RESET_CRON_SCHEDULE } from './common/constants.js';
import { Lineups } from './models/index.js';
import ServiceProvider from './services/serviceProvider.js';
import { sendDebugErrorMessage, sendDebugInfoMessage, sendMessage } from './utils/index.js';

// For local development
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('[INFO] Hello world! Listening on port', port);
});

const bot = new Client();
const localCache = new LocalCache(); // TODO: Deprecate
const serviceProvider = new ServiceProvider();

/**
 * Setup and run bot
 */
bot.on('ready', async () => {
    sendDebugInfoMessage(bot, 'Setting up bot');
    if (bot && bot.user) {
        bot.user.setActivity(".help | Sup gamers");

        sendDebugInfoMessage(bot, 'Connecting to MongoDB.');
        const isConnectedToDB = await mongoose.connect(process.env.DB_URL, {
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => {
            sendDebugInfoMessage(bot, 'Connected to MongoDB.');
            return true;
        }).catch((error : Error) => {
            sendDebugErrorMessage(bot, error);
            sendDebugInfoMessage(bot, 'Failed to connect to MongoDB.');
            return false;
        });

        if (!isConnectedToDB) {
            // TODO: Perhaps create cron to retry connecting to mongoDB
            return;
        }

        sendDebugInfoMessage(bot, 'Connecting to Redis.');
        await serviceProvider.init().then(() => {
            sendDebugInfoMessage(bot, 'Connected to Redis.');
        }).catch((error : Error) => {
            sendDebugErrorMessage(bot, error)
            sendDebugInfoMessage(bot, 'Failed to connect to Redis.');
        })

        // TODO: Deprecate
        sendDebugInfoMessage(bot, 'Fetching data to local cache.');
        await localCache.fetchAll().then(async (fetchData) => {
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
                        sendDebugInfoMessage(bot, message, () => {});
                    });
                }
            }
        });

        sendDebugInfoMessage(bot, 'Bot is ready', () => {});
    }
});

if (process.env.ALLOW_LEGACY_MESSAGING) {
    bot.on('message', (message) => {
        if (message.author == bot.user) { // Prevent bot from responding to its own messages
            return;
        }

        // original manual method with PREFIX ('.' by default)
        if (message.content.startsWith(PREFIX)) {
            processCommand(bot, localCache, message, serviceProvider);
        }
    });
}

/** Reset lineups daily based on a schedule */
cron.schedule(RESET_CRON_SCHEDULE, () => {
    localCache.resetAllLineups().then(() => {
        const content = { 'Notification': 'All lineups have been reset.' };
        sendMessage(
            bot.channels.cache.get(MAIN_CHANNEL_ID) as TextChannel,
            content,
            'information',
            'Scheduled Reset',
        );
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));
}, {
    scheduled: true,
    timezone: "Asia/Manila", // TODO: base timezone based on guild (server) config
});

bot.login(process.env.BOT_TOKEN);
