import dotenv from 'dotenv';
dotenv.config();

export const PREFIX = '.'; // TODO: Replace with slash commands

export const RESET_CRON_SCHEDULE = '0 6 * * *';

export const NOTIF_MSG_TIME_DEL = 10000;
export const ERROR_MSG_TIME_DEL = 15000;
export const WARNING_MSG_TIME_DEL = 30000;
export const DEFAULT_MSG_TIME_DEL = NOTIF_MSG_TIME_DEL;

export const COLORS = {
    SUCCESS: '#28CC2D',
    INFORMATION: '#63CAD8',
    ERROR: '#D82E3F',
    WARNING: '#FFE135',
    DEBUG_INFO: '#003A6D',
    DEBUG_ERROR: '#AF0000',
};

export const DEBUG_INFO_MSG_TIME_DEL = 60000;

export const MAIN_CHANNEL_ID = process.env.CHANNEL_ID || '';
export const INFO_CHANNEL_ID = process.env.INFO_CHANNEL_ID || '';
export const ERROR_CHANNEL_ID = process.env.ERROR_CHANNEL_ID || '';

export const PUNISH_TAG = '<@&747740479638208532>';
export const PUNISH_ID = '747740479638208532'
export const PUNISH_TIME_DEL = 500;

export const COPYPASTA_DELAY = 3000;

export const READY_MESSAGE = 'G ';

export const RESERVED_KEYWORDS = [
    'add',
    'all',
    'delete',
    'edit',
    'g',
    'game',
    'games',
    'gamelist',
    'help',
    'join',
    'kick',
    'leave',
    'lineup',
    'lineups',
    'list',
    'ready',
    'remove',
    'reset',
    'save',
    'savelist',
    'user',
];
export const ALPHANUMERIC = /^[a-z0-9]+$/i;
