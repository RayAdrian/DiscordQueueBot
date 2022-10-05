import { Client, Message } from 'discord.js';
import { Game } from '../models/game.js';
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
    fetchAll() : void {
        this.gamesCache.fetch().then(() => {
            this.initializeLineups();
            this.lineupsCache.fetch();
            this.usersCache.fetch();
        });
    };

    /**
     * Initialize lineups
     */
    initializeLineups() : void {
        return this.lineupsCache.initialize(this.gamesCache.getGameNames());
    };

    /**
     * Get a copy of the data of a game
     * @param name - name of the game
     */
    getGame(name : string) : Game {
        return this.gamesCache.getGame(name);
    }

    /**
     * Get a deep copy of the list of game names stored in the games cache.
     * @returns An array of strings with the list of the names of the games
     */
    getGameNames() : Array<string> {
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
     * Get a copy of a specified game's lineup
     * @param name - name of the lineup to be retrieved
     * @returns array of user id strings in the lineup
     */
    getLineup(name : string) : Array<string> {
        return this.lineupsCache.getLineup(name);
    }

    /**
     * Get a deep copy of the list of lineups stored in the lineups cache.
     * @returns List of lineups per game
     */
    getLineups() : Map<string, Array<string>> {
        return this.lineupsCache.getLineups();
    }

    /**
     * Adds a user to a specified lineup
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param gameName - name of the game of the relevant lineup
     * @param user - user id to be added to the lineup
     */
     addUserToLineup = (
        bot : Client,
        message : Message,
        gameName : string,
        user : string,
    ) : void => {
        const game : Game = this.gamesCache.getGame(gameName);
        this.lineupsCache.addUser(bot, message, game, user);
    }

    /**
     * Removes a user from a specified lineup
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param gameName - name of the game of the relevant lineup
     * @param user - user id to be added to the lineup
     */
     removeUserFromLineup = (
        bot : Client,
        message : Message,
        gameName : string,
        user : string,
    ) : void => {
        this.lineupsCache.removeUser(bot, message, gameName, user);
    }

    /**
     * Reset all lineups
     */
     resetAllLineups() : void {
        this.lineupsCache.resetAllLineups();
    }

    /**
     * Reset specified lineups
     * @param names - list of names of game lineups to be reset
     */
     resetLineups(names : Array<string>) : void {
        this.lineupsCache.resetLineups(names);
    }
};
