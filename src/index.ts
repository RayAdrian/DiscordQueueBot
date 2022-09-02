import Discord from 'discord.js';
import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { Report, User } from './models';

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});

const bot = new Discord.Client();
