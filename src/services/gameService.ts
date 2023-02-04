import { RedisClientType } from 'redis';
import { Games, Game } from "../models/index.js";

export default class GameService {
    public redisClient: RedisClientType;

    setRedisClient(redisClient : RedisClientType) : void {
        this.redisClient = redisClient;
    }
};
