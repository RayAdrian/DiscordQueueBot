import { RedisClientType } from 'redis';
import { ARRAY_SEPARATOR } from '../common/constants.js';
import { Games, Game } from "../models/index.js";
import LineupService from './lineupService.js';

export default class GameService {
    private redisClient: RedisClientType;
    private isRedisEnabled: boolean = false;
    private lineupService: LineupService;

    constructor(redisClient : RedisClientType) {
        this.redisClient = redisClient;
    }

    init(lineupService : LineupService) : void {
        this.lineupService = lineupService;
    }

    enableRedisClient() : void {
        if (this.redisClient) {
            this.isRedisEnabled = true;
        }
    }

    /**
     * Get game object
     * @param name - name of the game
     */
    getGame(name : string) : Promise<Game> {
        let fetchingCached = Promise.resolve(null);
        const gameKey = `game-${name}`;
        if (this.isRedisEnabled) {
            fetchingCached = this.redisClient.get(gameKey).then((cachedGame) => {
                if (cachedGame) {
                    return new Game(JSON.parse(cachedGame));
                }
                return null;
            });
        }

        return fetchingCached.then((game) => {
            if (game) {
                return Promise.resolve(game);
            }
            return Games.findOne({ name }).then((rawGame) => {
                if (rawGame) {
                    const game = new Game(rawGame);
                    if (this.isRedisEnabled) {
                        this.redisClient.set(gameKey, JSON.stringify(game));
                    } 
                    return game;
                }
                return null;
            });
        }).then((game) => game);
    }

    /**
     * Get list of all game names.
     * @returns An array of strings with the list of the names of the games
     */
    getGameNames() : Promise<Array<string>> {
        let fetchingCached = Promise.resolve(null);
        const gameNamesKey = 'game-names';
        if (this.isRedisEnabled) {
            fetchingCached = this.redisClient.get(gameNamesKey).then((cachedGameNames) => {
                if (cachedGameNames) {
                    return cachedGameNames.split(ARRAY_SEPARATOR);
                }
                return null;
            });
        }

        return fetchingCached.then((gameNames) => {
            if (gameNames) {
                return Promise.resolve(gameNames);
            }
            return Games.find({}).exec().then((rawGames) => {
                const gameNames = rawGames.map((game) => game.name).sort();
                if (this.isRedisEnabled) {
                    this.redisClient.set(gameNamesKey, gameNames.join(ARRAY_SEPARATOR));
                }
                return gameNames;
            });
        }).then((gameNames) => gameNames);
    }

    /**
     * Function to handle `.game add <name> <role> <limit>`
     * Add a game to the database, then to the cache
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - number of slots for the game's lineup
     */
    addGame(name : string, roleId : string, limit : number) : Promise<Game> {
        return Games.create({
            name, roleId, limit,
        }).then(async (data) => {
            const newGame = new Game(data);

            if (this.isRedisEnabled) {
                const gameNamesKey = 'game-names';
                this.redisClient.get(gameNamesKey).then((cachedGameNames) => {
                    if (cachedGameNames !== null) {
                        const newCachedGameNames = [
                            ...cachedGameNames.split(ARRAY_SEPARATOR),
                            newGame.getName(),
                        ].sort().join(ARRAY_SEPARATOR);
                        this.redisClient.set(gameNamesKey, newCachedGameNames);
                    }
                });
            }
            
            await this.lineupService.addLineup(newGame.getName());

            return newGame;
        });
    }

    /**
     * Function to handle `.game edit <name> <role> <?limit>`
     * Edit a game's set parameters
     * @param name - name of the game
     * @param roleId - role to link to game
     * @param limit - (optional) number of slots for the game's lineup
     */
    editGame(name : string, roleId : string, limit ?: string) : Promise<Game> {
        let updatingGame = this.getGame(name).then((currentGame) => {
            // check if there any changes to be done
            if (roleId === currentGame.getRoleId() && (!limit || Number(limit) === currentGame.getLimit())) {
                return Promise.reject(`No changes requested to game \`${name}\`.`);
            }

            // apply changes
            const newGameParams = { roleId };
            if (limit) {
                newGameParams['limit'] = Number(limit);
            }

            return Games.findOneAndUpdate(
                { name },
                { $set: newGameParams },
                { new: true },
            ).exec();
        }).then((data) => new Game(data));

        if (this.isRedisEnabled) {
            const gameKey = `game-${name}`;
            updatingGame = updatingGame.then((editedGame) => {
                this.redisClient.set(gameKey, JSON.stringify(editedGame));
                return editedGame;
            })
        }

        return updatingGame;
    }

    /**
     * Function to handle `.game remove <name>`
     * Remove a game from the database, then the cache
     * @param name - name of the game
     */
    removeGame(name : string) : Promise<void> {
        // TODO: Delete associated lineup from db and cache
        let deletingGame : Promise<any> = Games.deleteOne({ name }).exec();

        if (this.isRedisEnabled) {
            const gameKey = `game-${name}`;
            deletingGame = deletingGame.then(() => this.redisClient.del(gameKey));

            const gameNamesKey = 'game-names';
            deletingGame = deletingGame.then(() => {
                return this.redisClient.get(gameNamesKey);
            }).then((cachedGameNames) => {
                if (cachedGameNames !== null) {
                    const newCachedGameNames = new Set(cachedGameNames.split(ARRAY_SEPARATOR));
                    newCachedGameNames.delete(name);
                    return this.redisClient.set(gameNamesKey, [...newCachedGameNames].sort().join(ARRAY_SEPARATOR));
                }
                return Promise.resolve(null);
            });
        }

        return deletingGame.then(() => {});
    }
};
