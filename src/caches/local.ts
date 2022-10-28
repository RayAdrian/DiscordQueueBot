import { Document, UpdateWriteOpResult } from 'mongoose';
import { Game, IGame, IGameMethods } from '../models/game.js';
import { ILineup, Lineup } from '../models/lineup.js';
import { IUser } from '../models/user.js';
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
    fetchAll() : Promise<void | [
        { missingLineups: ILineup[]; invalidLineups: (ILineup & Document<any, any, ILineup>)[]; },
        void,
    ]> {
        return this.gamesCache.fetch().then(() => {
            this.lineupsCache.initialize(this.gamesCache.getGameNames());
            return Promise.all([this.lineupsCache.fetch(), this.usersCache.fetch()]);
        });
    };

    /**
     * Get a copy of the data of a game
     * @param name - name of the game
     * @returns a Game object
     */
    getGame(name : string) : Game {
        return this.gamesCache.getGame(name);
    }

    /**
     * Get the role associated to a game
     * @param name - name of the game
     * @returns the role id string
     */
    getRole(name : string) : string {
        return this.gamesCache.getGame(name).roleId;
    }

    /**
     * Get a deep copy of the list of game names stored in the games cache.
     * @returns an array of strings with the list of the names of the games
     */
    getGameNames() : Array<string> {
        return this.gamesCache.getGameNames();
    }

    /**
     * Add a game to local games cache and to the database
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - number of slots for the game's lineup
     */
    addGame(
        name : string,
        roleId : string,
        limit : number,
    ) : Promise<(ILineup & Document<any, any, ILineup>) | (IGame & Document<any, any, IGame> & IGameMethods)> {
        return this.gamesCache.addGame(name, roleId, Number(limit)).then(() => {
            return this.lineupsCache.addLineup(name);
        });
    }

    /**
     * Edit a game's set parameters
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - (optional) number of slots for the game's lineup
     */
    editGame(
        name : string,
        roleId : string,
        limit ?: string,
    ) : Promise<IGame & Document<any, any, IGame> & IGameMethods>  {
        return this.gamesCache.editGame(name, roleId, limit);
    }

    /**
     * Remove a game (and it's lineup/s) from the cache and database
     * @param name - name of the game
     */
    removeGame(name : string) : Promise<ILineup & Document<any, any, ILineup>> {
        return this.gamesCache.removeGame(name).then(() => {
            return this.lineupsCache.removeLineup(name);
        });
    }

    /**
     * Get list of games saved by a user
     * @param userId - id of the specified user
     * @returns list of strings of game names
     */
    getUserGames(userId : string) : Array<string> {
        return this.usersCache.getUserGames(userId);
    }

    /**
     * Save game/s to user's game list in cache and database
     * @param userId - id of the specified user
     * @param gameNames - name of the games to be saved
     */
    saveToUserGames(userId : string, gameNames : Array<string>) : Promise<IUser & Document<any, any, IUser>> {
        return this.usersCache.saveToUserGames(userId, gameNames);
    }

    /**
     * Remove game/s from user's game list in cache and database
     * @param userId - id of the specified user
     * @param gameNames - name of the games to be removed
     */
    removeFromUserGames(userId : string, gameNames : Array<string>) : Promise<IUser & Document<any, any, IUser>> {
        return this.usersCache.removeFromUserGames(userId, gameNames);
    }

    /**
     * Clear all games from user's game list in cache and database
     * @param userId - id of the specified user
     */
    clearUserGames(userId : string) : Promise<IUser & Document<any, any, IUser>> {
        return this.usersCache.clearUserGames(userId);
    }

    /**
     * Check whether user has been initialized in the users cache
     * @param userId - id of the specified user
     */
    confirmUserInit(userId : string) : Promise<void> {
        return this.usersCache.confirmUserInit(userId);
    }

    /**
     * Split games into games that the user has saved, and games that they have not.
     * @param userId - id of the specified user
     * @param gameNames - the list of games to process
     * @returns an object containing 2 arrays, one for saved games, and the other for unsaved games
     */
    processIfUserHasGames(
        userId : string, gameNames : Array<string>,
    ) : { savedGames: Array<string>; unsavedGames: Array<string>; } {
        return this.usersCache.processIfUserHasGames(userId, gameNames);
    }

    /**
     * Get a copy of a specified game's lineup
     * @param gameName - name of the lineup to be retrieved
     * @returns a Lineup object
     */
    getLineup(gameName : string) : Lineup {
        return this.lineupsCache.getLineup(gameName);
    }

    /**
     * Get a deep copy of the list of lineups
     * @returns list of Lineup objects
     */
    getLineups() : Array<Lineup> {
        return this.lineupsCache.getLineups();
    }

    /**
     * Get a specific list of lineups
     * @param gameNames - list of names of game lineups to fetch
     * @param fullOnly - optional param to only fetch full lineups
     * @returns list of Lineup objects
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
     * @param userId - id of the specified user
     * @returns list of Lineup objects
     */
    getUserLineups(userId : string) : Array<Lineup> { 
        return this.lineupsCache.getUserLineups(userId);
    }

    /**
     * Adds user/s to a specified lineup
     * @param gameName - name of the game of the relevant lineup
     * @param userIds - user ids to be added to the lineup
     */
    addUsersToLineup(
        gameName : string, userIds : Array<string>,
    ) : Promise<ILineup & Document<any, any, ILineup>> {
        return this.lineupsCache.addUsers(gameName, userIds);
    }

    /**
     * Adds a user to the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param userId - user id to be added to the lineups
     */
    joinLineups(
        gameNames : Array<string>, userId : string,
    ) : Promise<(ILineup & Document<any, any, ILineup>)[]> {
        return this.lineupsCache.joinLineups(gameNames, userId);
    }

    /**
     * Removes user/s from a specified lineup
     * @param gameName - game name of the specified lineup
     * @param userIds - user ids to be removed from the lineup
     */
    removeUsersFromLineup(
        gameName : string, userIds : Array<string>,
    ) : Promise<ILineup & Document<any, any, ILineup>> {
        return this.lineupsCache.removeUsers(gameName, userIds);
    }

    /**
     * Removes a user from the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param userId - user id to be removed from the lineups
     */
    leaveLineups(
        gameNames : Array<string>, userId : string,
    ) : Promise<(ILineup & Document<any, any, ILineup>)[]> {
        return this.lineupsCache.leaveLineups(gameNames, userId);
    }

    /**
     * Reset all lineups
     */
    resetAllLineups() : Promise<UpdateWriteOpResult> {
        return this.lineupsCache.resetAllLineups();
    }

    /**
     * Reset specified lineups
     * @param gameNames - list of names of game lineups to be reset
     */
    resetLineups(gameNames : Array<string>) : Promise<UpdateWriteOpResult> {
        return this.lineupsCache.resetLineups(gameNames);
    }

    /**
     * Check if lineup is full
     * @param gameName - name of game lineup to check
     * @returns true if the lineup is full, false otherwise
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
     * @returns the number of slots remaining
     */
    getLineupOpenings(gameName : string) : number {
        const { isInfinite, limit } = this.getGame(gameName);
        if (isInfinite) {
            return Infinity;
        }

        const userCount = this.getLineup(gameName).getUserCount();
        return limit - userCount;
    }

    /**
     * Check if a user is in a lineup
     * @param gameName  - name of game lineup to check
     * @param userId - id of the specified user
     * @returns true if the user is in the lineup, false otherwise
     */
    lineupHasUser(gameName, userId) : boolean {
        return this.getLineup(gameName).hasUser(userId);
    }
};
