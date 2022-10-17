import { Client, Message } from 'discord.js';
import { Document } from 'mongoose';
import { Game } from '../models/game.js';
import { ILineup, Lineup } from '../models/lineup.js';
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
     * Get the role associated to a game
     * @param name - name of the game
     */
    getRole(name : string) : string {
        return this.gamesCache.getGame(name).roleId;
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
     * Remove a game (and it's lineup/s) from the cache and database
     * @param name - name of the game
     */
    removeGame(name : string) : Promise<ILineup & Document<any, any, ILineup>> {
        return this.gamesCache.removeGame(name).then(() => {
            return this.lineupsCache.removeLineup(name);
        });
    }

    /**
     * Get a copy of a specified game's lineup
     * @param gameName - name of the lineup to be retrieved
     * @returns array of user id strings in the lineup
     */
    getLineup(gameName : string) : Lineup {
        return this.lineupsCache.getLineup(gameName);
    }

    /**
     * Get a deep copy of the list of lineups
     * @returns List of lineups per game
     */
    getLineups() : Array<Lineup> {
        return this.lineupsCache.getLineups();
    }

    /**
     * Get a specific list of lineups
     * @param gameNames - list of names of game lineups to fetch
     * @param fullOnly - optional param to only fetch full lineups
     * @returns List of lineups per game
     */
    getFilteredLineups(
        gameNames : Array<string>, fullOnly : boolean = false,
    ) : Array<Lineup> {
        const lineups = this.lineupsCache.getFilteredLineups(gameNames);
        if (fullOnly) {
            return lineups.filter((lineup) => this.isLineupFull(lineup.getGameName()));
        }
        return lineups;
    }

    /**
     * Get the lineups a user is part in
     * @param user
     */
    getUserLineups(user : string) : Array<Lineup> { 
        return this.lineupsCache.getUserLineups(user);
    }

    /**
     * Adds user/s to a specified lineup
     * @param gameName - name of the game of the relevant lineup
     * @param users - user ids to be added to the lineup
     */
    addUsersToLineup = (gameName : string, users : Array<string>) : void => {
        this.lineupsCache.addUsers(gameName, users);
    }

    /**
     * Adds a user to the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param user - user id to be added to the lineups
     */
    joinLineups = (gameNames : Array<string>, user : string) : void => {
        this.lineupsCache.joinLineups(gameNames, user);
    }

    /**
     * Removes user/s from a specified lineup
     * @param gameName - game name of the specified lineup
     * @param users - user ids to be removed from the lineup
     */
    removeUsersFromLineup(gameName : string, users : Array<string>) : void {
        this.lineupsCache.removeUsers(gameName, users);
    }

    /**
     * Removes a user from the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param user - user id to be removed from the lineups
     */
    leaveLineups = (gameNames : Array<string>, user : string) : void => {
        this.lineupsCache.leaveLineups(gameNames, user);
    }

    /**
     * Reset all lineups
     */
    resetAllLineups() : void {
        this.lineupsCache.resetAllLineups();
    }

    /**
     * Reset specified lineups
     * @param gameNames - list of names of game lineups to be reset
     */
    resetLineups(gameNames : Array<string>) : void {
        this.lineupsCache.resetLineups(gameNames);
    }

    /**
     * Check if lineup is full
     * @param gameName - name of game lineup to check
     * @returns boolean whether lineup is full
     */
    isLineupFull(gameName : string) : boolean {
        const { isInfinite, limit } = this.getGame(gameName);
        if (isInfinite) {
            return false;
        }

        const userCount = this.getLineup(gameName).getUserCount();
        if (userCount < limit) {
            return false;
        }
        return true;
    };

    /**
     * Check how many slots are available in a lineup
     * @param gameName - name of game lineup to check
     */
    getLineupOpenings(gameName : string) : number {
        const { isInfinite, limit } = this.getGame(gameName);
        if (isInfinite) {
            return Infinity;
        }

        const userCount = this.getLineup(gameName).getUserCount();
        return limit - userCount;
    }

    lineupHasUser(gameName, user) : boolean {
        return this.getLineup(gameName).hasUser(user);
    }
};
