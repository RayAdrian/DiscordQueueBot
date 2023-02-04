import { RedisClientType } from 'redis';
import { Games, Game } from "../models/index.js";

export default class GameService {
    public redisClient: RedisClientType;

    setRedisClient(redisClient : RedisClientType) : void {
        this.redisClient = redisClient;
    }

    /**
     * Get game object
     * @param name - name of the game
     */
    getGame(name : string) : Promise<Game> {
        const key = `game-${name}`;

        return this.redisClient.get(key).then((cachedGame) => {
            console.log('cachedGame', cachedGame);
            if (cachedGame) {
                return Promise.resolve(new Game(JSON.parse(cachedGame)));
            }
            return Games.findOne({ name }).then((rawGame) => {
                if (rawGame) {
                    const game = new Game(rawGame);
                    this.redisClient.set(key, JSON.stringify(game));
                    return game;
                }
                return null;
            });
        }).then((game) => game);
    }
};
