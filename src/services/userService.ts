import { RedisClientType } from 'redis';
import { Users, User } from '../models/index.js';
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

    /**
     * Get list of games saved by a user
     * @param id - id of the specified user
     * @returns list of strings of game names
     */
    getUserGames(id : string) : Promise<Array<string>> {
        let fetchingCached = Promise.resolve(null);
        const userKey = `user-${id}`;
        if (this.isRedisEnabled) {
            fetchingCached = this.redisClient.get(userKey).then((cachedUser) => {
                if (cachedUser) {
                    console.log(JSON.parse(cachedUser));
                    return new User(JSON.parse(cachedUser));
                }
                return null;
            });
        }

        return fetchingCached.then((user) => {
            if (user) {
                return Promise.resolve(user);
            }
            return Users.findOne({ id }).then((rawUser) => {
                const user = rawUser
                ? new User(rawUser)
                : new User({ id, gameNames: [] });
                const wrappedUser = user.getUserWrapper();

                if (!rawUser) {
                    Users.create(wrappedUser).then(() => {
                        if (this.isRedisEnabled) {
                            this.redisClient.set(userKey, JSON.stringify(wrappedUser));
                        }
                    });
                } else {
                    if (this.isRedisEnabled) {
                        this.redisClient.set(userKey, JSON.stringify(wrappedUser));
                    }
                }

                return user;
            });
        }).then((user) => user.getGameNames());
    }
};
