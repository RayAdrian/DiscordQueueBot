import dotenv from 'dotenv';
dotenv.config();

export const PREFIX = '.'; // TODO: Replace with slash commands

export const MSG_TIME_DEL = 3000;
export const MSG_TIME_FULL_DEL = 10000;
export const INFO_MSG_TIME_DEL = 60000;
export const MAIN_CHANNEL_ID = process.env.CHANNEL_ID || '';
export const INFO_CHANNEL_ID = process.env.INFO_CHANNEL_ID || '';
export const ERROR_CHANNEL_ID = process.env.ERROR_CHANNEL_ID || '';

export const PUNISH_TAG = '<@&747740479638208532>';
export const PUNISH_ID = '747740479638208532'
export const PUNISH_TIME_DEL = 500;

export const RESERVED_KEYWORDS = [
    'add',
    'edit',
    'game',
    'help',
    'join',
    'kick',
    'leave',
    'lineup',
    'list',
    'remove',
    'reset',
    'save',
    'user',
];
export const ALPHANUMERIC = /^[a-z0-9]+$/i;