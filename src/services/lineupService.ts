import { RedisClientType } from 'redis';

export default class LineupService {
    private redisClient: RedisClientType;
    private isRedisEnabled: boolean = false;

    constructor(redisClient : RedisClientType) {
        this.redisClient = redisClient;
    }

    enableRedisClient() : void {
        if (this.redisClient) {
            this.isRedisEnabled = true;
        }
    }
};
