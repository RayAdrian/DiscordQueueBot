import { createClient, RedisClientType } from 'redis';
import CooldownService from './cooldownService.js';
import GameService from './gameService.js';
import LineupService from './lineupService.js';
import UserService from './userService.js';

export default class ServiceProvider {
    private redisClient: RedisClientType;
    public gameService : GameService;
    public lineupService : LineupService;
    public userService : UserService;
    public cooldownService : CooldownService;

    constructor() {
        this.redisClient = createClient();
        this.lineupService = new LineupService(this.redisClient);
        this.gameService = new GameService(this.redisClient);
        this.userService = new UserService(this.redisClient);
        this.cooldownService = new CooldownService(this.redisClient);
    }

    init() : Promise<void> {
        this.gameService.init(this.lineupService);
        this.lineupService.init(this.gameService);
        return this.redisConnect().then(() => {
            this.gameService.enableRedisClient();
            this.lineupService.enableRedisClient();
            this.userService.enableRedisClient();
            this.cooldownService.enableRedisClient();
        });
    }

    redisConnect() : Promise<void> {
        return this.redisClient.connect();
    }
};
