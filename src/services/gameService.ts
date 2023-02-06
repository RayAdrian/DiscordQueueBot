import { RedisClientType } from 'redis';
import { REDIS_ENABLED } from '../common/constants.js';
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
        let redisPromise = Promise.resolve(null);
        if (REDIS_ENABLED && this.hasRedis !== null) {
            const key = `game-${name}`;
            redisPromise = this.redisClient.get(key).then((cachedGame) => {
                if (cachedGame) {
                    return new Game(JSON.parse(cachedGame));
                }
                return null;
            });
        }
        return redisPromise.then((game) => {
            if (game) {
                return Promise.resolve(game);
            }
            return Games.findOne({ name }).then((rawGame) => {
                if (rawGame) {
                    const game = new Game(rawGame);
                    return game;
                }
                return null;
            });
        }).then((game) => game);
    }
};
