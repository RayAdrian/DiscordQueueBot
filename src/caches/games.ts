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
     * Fetch games data from the database to save in the local cache
     */
    fetch() : Promise<void> {
        return Games.find({}).exec().then((data) => {
            data.forEach((game) => {
                const name = game.name;
                this.gamesMap.set(name, game);
                this.gameNames.add(name);
            });
        });
    }

    /**
     * Get a deep copy of the list of game names stored in the games cache.
     * @returns An array of strings with the list of the names of the games
     */
    getGameNames() : Array<string> {
        return Array(...this.gameNames);
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
        const currentGame = this.gamesMap.get(name);
        // check if there any changes to be done
        if (roleId === currentGame.roleId && (!limit || Number(limit) === currentGame.limit)) {
            sendMessage(message.channel, 'No changes to be done.');
            return;
        }

        // apply changes
        const newGameParams = { roleId };
        if (limit) {
            newGameParams['limit'] = Number(limit);
        }
        Games.findOneAndUpdate(
            { name },
            { $set: newGameParams },
            { new: true },
        ).then((editedGame) => {
            this.gamesMap.set(name, editedGame);
            sendMessage(message.channel, 'Game edited.');
        }).catch(error => sendErrorMessage(bot, error));
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
        Games.deleteOne({ name })
            .then(() => {
                this.gamesMap.delete(name);
                this.gameNames.delete(name);
                sendMessage(message.channel, 'Game deleted.');
            })
            .catch(error => sendErrorMessage(bot, error));
    }
};
