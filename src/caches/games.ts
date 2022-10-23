import { Client, Message } from "discord.js";
import { Document } from 'mongoose';
import { Games, Game, IGame, IGameMethods } from "../models";
import { sendErrorMessage, sendMessage } from "../utils";

export default class GamesCache {
    private gamesMap: Map<string, Game>;
    private gameNames: Set<string>;

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
     * Get a copy of the data of a game
     * @param name - name of the game
     */
    getGame(name : string) : Game {
        const gameData = this.gamesMap.get(name);
        return JSON.parse(JSON.stringify(gameData)) as Game;
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
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - number of slots for the game's lineup
     */
    addGame(
        name : string,
        roleId : string,
        limit : number,
    ) : Promise<IGame & Document<any, any, IGame> & IGameMethods> {
        const newGame = new Game({
            name, roleId, limit,
        });
        this.gamesMap.set(name, newGame);
        this.gameNames.add(name);
        return Games.create(newGame);
            
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
     * @param name - name of the game
     */
    removeGame(
        name : string,
    ) : Promise<{ ok?: number; n?: number; } & { deletedCount?: number; }> {
        this.gamesMap.delete(name);
        this.gameNames.delete(name);
        return Games.deleteOne({ name }).exec();
    }
};
