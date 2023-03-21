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

    // TODO: Modify getGames to:
    // 1. Accept specified boolean if retrieving all games or not
    // 2. Be able to retrieve from cache and/or db more efficiently

    /**
     * Get game objects
     * @param names - names of the games
     */
    getGames(names : Array<string>) : Promise<Array<Game>> {
        return this.getGameNames().then((gameNames) => {
            const validNamesSet = new Set(gameNames);
            const validatedGameNames = names.filter((name) => validNamesSet.has(name)).sort();

            return Promise.all(validatedGameNames.map((gameName) => {
                return this.getGame(gameName);
            }));
        });
    }

    /**
     * Get game objects arranged in a map
     * @param names - names of the games
     */
    getGamesMap(names : Array<string>) : Promise<Map<String, Game>> {
        return this.getGames(names).then((games) => {
            const gamesMap = new Map<String, Game>();

            games.forEach((game) => {
                gamesMap.set(
                    game.getName(),
                    game,
                );
            });

            return gamesMap;
        });
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
        }).then((data) => {
            const newGame = new Game(data);
            const newGameWrapper = newGame.getGameWrapper();
            const asyncOperations : Array<Promise<any>> = [];

            asyncOperations.push(this.lineupService.addLineup(newGame.getName()));

            if (this.isRedisEnabled) {
                const gameKey = `game-${name}`;
                const gameNamesKey = 'game-names';

                asyncOperations.push(this.redisClient.set(gameKey, JSON.stringify(newGameWrapper)));
                asyncOperations.push(this.redisClient.get(gameNamesKey).then((cachedGameNames) => {
                    if (cachedGameNames !== null) {
                        const newCachedGameNames = [
                            ...cachedGameNames.split(ARRAY_SEPARATOR),
                            newGame.getName(),
                        ].sort().join(ARRAY_SEPARATOR);
                        this.redisClient.set(gameNamesKey, newCachedGameNames);
                    }
                }));
            }

            return Promise.allSettled(asyncOperations).then(() => newGame);
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
    removeGame(name : string) : Promise<Game> {
        return Games.findOneAndDelete({ name }).exec().then((rawGame) => {
            const deletedGame = new Game(rawGame);
            const asyncOperations : Array<Promise<any>> = [];

            asyncOperations.push(this.lineupService.removeLineup(deletedGame.getName()));

            if (this.isRedisEnabled) {
                const gameKey = `game-${name}`;
                const gameNamesKey = 'game-names';

                asyncOperations.push(this.redisClient.del(gameKey));
                asyncOperations.push(this.redisClient.get(gameNamesKey).then((cachedGameNames) => {
                    if (cachedGameNames !== null) {
                        const newCachedGameNames = new Set(cachedGameNames.split(ARRAY_SEPARATOR));
                        newCachedGameNames.delete(name);
                        return this.redisClient.set(gameNamesKey, [...newCachedGameNames].sort().join(ARRAY_SEPARATOR));
                    }
                    return Promise.resolve(null);
                }));
            }

            return Promise.allSettled(asyncOperations).then(() => deletedGame);
        });
    }
};
