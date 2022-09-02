import Discord from 'discord.js';
import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';

import { GameCache } from './common/types';
import { Game, User } from './models';

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});

const bot = new Discord.Client();

const gameCache = new GameCache();

const _init = () => {
  Game.find({}).exec().then((data) => {
    data.forEach((game) => {
      const name = game.name;
      gameCache.gamesMap[name] = game;
      gameCache.gameNamesList.push(name);
      gameCache.lineups[name] = []; // TODO: Init with lineup from db
    });
  });
};

bot.on('ready', async () => {
  console.log('Bot is online');
  if (bot && bot.user) {
    bot.user.setActivity(".help | Sup gamers");
  }

  // await mongoose.connect('mongodb://localhost/Reports');
  await mongoose.connect(process.env.DB_URL || '');

  const date = new Date()

  _init();
  console.log('gamesMap', gameCache.gamesMap);
  console.log('gameNamesList', gameCache.gameNamesList);
  console.log('lineups', gameCache.lineups);
});