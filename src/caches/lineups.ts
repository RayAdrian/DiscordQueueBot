import { Client, Message } from 'discord.js';
import { Game } from '../models';
import { sendMessage } from '../utils';

export default class LineupsCache {
    lineups: Map<string, Array<string>>;

    constructor() {
        this.lineups = new Map<string, Array<string>>();
    }

    /**
     * initialize empty lineups for a list of games
     * @param gameNames - list of games to make lineups for
     */
    initialize(gameNames : Array<string>) : void {
        gameNames.forEach((name) => {
            this.lineups.set(name, []);
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
        return this.lineups.get(name).slice();
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
        this.lineups.forEach((gameLineup, gameName) => {
            lineupsCopy.set(gameName, gameLineup.slice());
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
    addUserToLineup(
        bot : Client,
        message : Message,
        game : Game,
        user : string,
    ) : void {
        const { name, limit } : { name : string, limit : number } = game;
        const gameLineup = this.lineups.get(name);

        if (gameLineup.length < limit) {
            gameLineup.push(user);
            sendMessage(message.channel, `User added to \`${name}\` lineup.`);
        }
    }

    /**
     * Reset all lineups
     */
    resetAllLineups() : void {
        // TODO: Add role validation and/or a voting check
        Array(...this.lineups.keys()).forEach((gameName) => this.lineups.set(gameName, []));
    }
};
