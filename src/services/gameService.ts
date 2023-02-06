import { RedisClientType } from 'redis';
import { ARRAY_SEPARATOR, REDIS_ENABLED } from '../common/constants.js';
import { Games, Game } from "../models/index.js";

export default class GameService {
    private redisClient: RedisClientType;
    private hasRedis: boolean = false;

    setRedisClient(redisClient : RedisClientType) : void {
        this.redisClient = redisClient;
        if (redisClient) {
            this.hasRedis = true;
        }
    }

    /**
     * Get game object
     * @param name - name of the game
     */
    getGame(name : string) : Promise<Game> {
        let fetchingCached = Promise.resolve(null);
        const key = `game-${name}`;
        if (REDIS_ENABLED && this.hasRedis) {
            fetchingCached = this.redisClient.get(key).then((cachedGame) => {
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
                    if (REDIS_ENABLED && this.hasRedis) {
                        this.redisClient.set(key, JSON.stringify(game));
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
        const key = `games`;
        if (REDIS_ENABLED && this.hasRedis) {
            fetchingCached = this.redisClient.get(key).then((cachedGameNames) => {
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
            return Games.find({}).exec().then((data) => {
                const gameNames = data.map((game) => game.name).sort();
                if (REDIS_ENABLED && this.hasRedis) {
                    this.redisClient.set(key, gameNames.join(ARRAY_SEPARATOR));
                }
                return gameNames;
            });
        }).then((gameNames) => gameNames);
    }
};
