import { Client, Message } from 'discord.js';
import { Game } from '../models';
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
     * Removes a lineup from the map ie. when a game is deleted.
     * @param name - name of the lineup to be deleted
     */
    removeLineup(name : string) : void {
        this.lineups.delete(name);
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
     * Adds a user to a specified lineup
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param game - game data of the relevant lineup
     * @param user - user id to be added to the lineup
     */
    addUser(
        bot : Client,
        message : Message,
        game : Game,
        user : string,
    ) : void {
        const { name, limit } : { name : string, limit : number } = game;
        const lineup = this.lineups.get(name);

        if (lineup.size < limit) {
            lineup.add(user);
            sendMessage(message.channel, `User added to \`${name}\` lineup.`);
        }
    }

    /**
     * Removes a user from a specified lineup
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param name - name of the game of the relevant lineup
     * @param user - user id to be added to the lineup
     */
     removeUser(
        bot : Client,
        message : Message,
        name : string,
        user : string,
    ) : void {
        const lineup = this.lineups.get(name);
        lineup.delete(user);
        sendMessage(message.channel, `User removed from \`${name}\` lineup.`);
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
