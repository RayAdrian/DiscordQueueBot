import { RedisClientType } from 'redis';
import GameService from './gameService.js';

export default class UserService {
    private gameService: GameService;
    private redisClient: RedisClientType;
    private isRedisEnabled: boolean = false;

    constructor(redisClient : RedisClientType, gameService: GameService) {
        this.redisClient = redisClient;
        this.gameService = gameService;
    }

    enableRedisClient() : void {
        if (this.redisClient) {
            this.isRedisEnabled = true;
        }
    }
};
