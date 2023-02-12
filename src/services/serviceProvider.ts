import { createClient, RedisClientType } from 'redis';
import GameService from './gameService.js';
import UserService from './userService.js';

export default class ServiceProvider {
    private redisClient: RedisClientType;
    public gameService : GameService;
    public userService : UserService;

    constructor() {
        this.redisClient = createClient();
        this.gameService = new GameService(this.redisClient);
        this.userService = new UserService(this.redisClient, this.gameService);
    }

    init() : Promise<void> {
        return this.redisConnect().then(() => {
            this.gameService.enableRedisClient();
        });
    }

    redisConnect() : Promise<void> {
        return this.redisClient.connect();
    }
};
