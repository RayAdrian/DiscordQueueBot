import { Client, Message } from 'discord.js';
import { sendMessage } from '../utils';

export default class LineupsCache {
    private lineups: Map<string, Set<string>>;

    constructor() {
        this.lineups = new Map<string, Set<string>>();
    }

    /**
     * initialize empty lineups for a list of games
     * @param gameNames - list of games to make lineups for
     */
    initialize(gameNames : Array<string>) : void {
        gameNames.forEach((name) => {
            this.lineups.set(name, new Set());
        });
    }

    /**
     * Fetch lineups data from the database to save in the local cache
     */
    fetch() : void {
        // TODO: Fetch Lineups
    }

    /**
     * Get a copy of a specified game's lineup
     * @param name - name of the lineup to be retrieved
     */
    getLineup(name : string) : Array<string> {
        return Array(...this.lineups.get(name));
    }

    /**
     * Get a deep copy of the list of lineups stored in the lineups cache.
     * @returns List of lineups per game
     */
    getLineups() : Map<string, Array<string>> {
        const lineupsCopy = new Map<string, Array<string>>();
        this.lineups.forEach((lineup, gameName) => {
            lineupsCopy.set(gameName, Array(...lineup));
        });
        return lineupsCopy;
    }

    /**
     * Get a specific list of lineups
     * @param gameNames - list of names of game lineups to fetch
     * @returns List of lineups per game
     */
    getFilteredLineups(gameNames : Array<string>) : Map<string, Array<string>> {
        const filteredLineups = new Map<string, Array<string>>();
        this.lineups.forEach((lineup, gameName) => {
            if (gameNames.includes(gameName)) {
                filteredLineups.set(gameName, Array(...lineup));
            }
        })
        return filteredLineups;
    }

    /**
     * Get the lineups a user is part in
     * @param user
     */
     getUserLineups(user : string) : Map<string, Array<string>> {
        const userLineups = new Map<string, Array<string>>();
        this.lineups.forEach((lineup, gameName) => {
            if (lineup.has(user)) {
                userLineups.set(gameName, Array(...lineup));
            }
        })
        return userLineups;
    }

    /**
     * Removes a lineup from the map ie. when a game is deleted.
     * @param name - name of the lineup to be deleted
     */
    removeLineup(name : string) : void {
        this.lineups.delete(name);
    }

    /**
     * Adds user/s to a specified lineup
     * @param name - game name of the specified lineup
     * @param users - user ids to be added to the lineup
     */
    addUsers = (name : string, users : Array<string>) : void => {
        const lineup = this.lineups.get(name);
        users.forEach((user) => lineup.add(user));
    }

    /**
     * Adds a user to specified lineups
     * @param names - game names of the specified lineups
     * @param user - user id to be added to the lineup
     */
    joinLineups = (names : Array<string>, user : string) : void => {
        names.forEach((name) => this.lineups.get(name).add(user));
    }

    /**
     * Removes user/s from a specified lineup
     * @param name - game name of the specified lineup
     * @param users - user ids to be removed from the lineup
     */
    removeUsers(name : string, users : Array<string>) : void {
        const lineup = this.lineups.get(name);
        users.forEach((user) => lineup.delete(user));
    }

    /**
     * Removes a user from the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param user - user id to be removed from the lineups
     */
    leaveLineups = (names : Array<string>, user : string) : void => {
        names.forEach((name) => this.lineups.get(name).delete(user));
    }

    /**
     * Reset all lineups
     */
    resetAllLineups() : void {
        this.lineups.forEach((lineup) => lineup.clear());
    }

    /**
     * Reset specified lineups
     * @param names - list of names of game lineups to be reset
     */
    resetLineups(names : Array<string>) : void {
        names.forEach((name) => this.lineups.get(name).clear());
    }
};
