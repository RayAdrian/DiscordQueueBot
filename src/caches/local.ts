import { Client, Message } from 'discord.js';
import GamesCache from './games.js';
import LineupsCache from './lineups.js';
import UsersCache from './users.js';

export default class LocalCache {
    private gamesCache: GamesCache;
    private lineupsCache: LineupsCache;
    private usersCache: UsersCache;

    constructor() {
        this.gamesCache = new GamesCache();
        this.lineupsCache = new LineupsCache();
        this.usersCache = new UsersCache();
    }

    /**
     * Update local cache with data from the DB
     */
    fetchAll = () => {
        this.gamesCache.fetch().then(() => {
            this.initializeLineups();
            this.lineupsCache.fetch();
            this.usersCache.fetch();
        });
    };

    /**
     * Initialize lineups
     */
    initializeLineups = () => {
        return this.lineupsCache.initialize(this.gamesCache.getGameNames());
    };

    /**
     * Get a deep copy of the list of game names stored in the games cache.
     * @returns An array of strings with the list of the names of the games
     */
    getGameNames = () : Array<string> => {
        return this.gamesCache.getGameNames();
    }

    /**
     * Function to handle `.game add <name> <role> <limit>`
     * Add a game to local games cache and to the database
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - number of slots for the game's lineup
     */
     addGame(
        bot : Client,
        message : Message,
        name : string,
        roleId : string,
        limit : number,
    ) : void {
        this.gamesCache.addGame(bot, message, name, roleId, Number(limit));
    }

    /**
     * Function to handle `.game edit <name> <role> <?limit>`
     * Edit a game's set parameters
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - (optional) number of slots for the game's lineup
     */
     editGame(
        bot : Client,
        message : Message,
        name : string,
        roleId : string,
        limit ?: string,
    ) : void {
        this.gamesCache.editGame(bot, message, name, roleId, limit);
    }

    /**
     * Function to handle `.game remove <name>`
     * Remove a game from the cache and database
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param name - name of the game
     */
     removeGame(
        bot : Client,
        message : Message,
        name : string,
    ) : void {
        this.gamesCache.removeGame(bot, message, name);
        this.lineupsCache.removeLineup(name);
    }

    /**
     * Get a deep copy of the list of lineups stored in the lineups cache.
     * @returns List of lineups per game
     */
    getLineups() : Map<string, Array<Array<string>>> {
        return this.lineupsCache.getLineups();
    }
};
