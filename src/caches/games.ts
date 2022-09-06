import { Client, Message } from "discord.js";
import { Games } from "../models";
import { Game } from "../models/game";
import { sendErrorMessage, sendMessage } from "../utils";

export default class GamesCache {
    gamesMap: Map<string, Game>;
    gameNames: Set<string>;

    constructor() {
        this.gamesMap = new Map<string, Game>();
        this.gameNames = new Set<string>();
    }

    /**
     * @returns An array of strings with the list of the names of the games
     */
    getGameNames() : Array<string> {
        return Array(...this.gameNames);
    }

    /**
     * Fetch games data from the database to save in the local cache
     */
    fetch() : void {
        Games.find({}).exec().then((data) => {
            data.forEach((game) => {
                const name = game.name;
                this.gamesMap.set(name, game);
                this.gameNames.add(name);
            });
        });
    }

    /**
     * Function to handle `.game add <name> <role> <limit>`
     * Add to local games cache and to the database
     * @param bot - for sending error messages
     * @param message - for replying to the original message
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - number of slots for the game's lineup
     */
    addGame(
        bot : Client,
        message : Message,
        name: string,
        roleId: string,
        limit: number,
    ) : void {
        const newGame = new Game({
            name, roleId, limit,
        });
        Games.create(newGame)
            .then(() => {
                this.gamesMap.set(name, newGame);
                this.gameNames.add(name);
                sendMessage(message.channel, 'Game added.');
            })
            .catch(error => sendErrorMessage(bot, error));
    }
};
