import { createClient, RedisClientType } from 'redis';
import GameService from './gameService.js';

export default class ServiceProvider {
    public redisClient: RedisClientType;
    public gameService : GameService;

    constructor() {
        this.redisClient = createClient();
        this.gameService = new GameService();
    }

    init() : Promise<void> {
        return this.redisConnect().then(() => {
            this.gameService.setRedisClient(this.redisClient);
        });
    }

    redisConnect() : Promise<void> {
        this.redisClient.on("error", (error) => console.log('[ERROR]', error));
        return this.redisClient.connect();
    }
};
