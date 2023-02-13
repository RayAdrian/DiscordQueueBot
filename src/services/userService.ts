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
     * Get user
     * @param id - id of the specified user
     * @returns user object
     */
    getUser(id : string) : Promise<User> {
        let fetchingCached = Promise.resolve(null);
        const userKey = `user-${id}`;
        if (this.isRedisEnabled) {
            fetchingCached = this.redisClient.get(userKey).then((cachedUser) => {
                if (cachedUser) {
                    return new User(JSON.parse(cachedUser));
                }
                return null;
            });
        }

        return fetchingCached.then((user) => {
            if (user) {
                return Promise.resolve(user);
            }
            return Users.findOne({ id }).then(async (rawUser) => {
                const user = rawUser
                ? new User(rawUser)
                : new User({ id, gameNames: [] });

                if (!rawUser) {
                    const wrappedUser = user.getUserWrapper();
                    await Users.create(wrappedUser);
                }

                return user;
            });
        }).then((user) => {
            const wrappedUser = user.getUserWrapper();
            if (this.isRedisEnabled) {
                this.redisClient.set(userKey, JSON.stringify(wrappedUser));
            }

            return user;
        });
    }

    /**
     * Get list of games saved by a user
     * @param id - id of the specified user
     * @returns list of strings of game names
     */
    getUserGames(id : string) : Promise<Array<string>> {
        return this.getUser(id).then((user) => user.getGameNames());
    }

    /**
     * Split games into games that the user has saved, and games that they have not.
     * @param userId - id of the specified user
     * @param gameNames - the list of games to process
     * @returns an object containing 2 arrays, one for saved games, and the other for unsaved games
     */
    processIfUserHasGames(
        id : string, gameNames : Array<string>,
    ) : Promise<{ savedGames: Array<string>; unsavedGames: Array<string>; }> {
        const savedGames : Array<string> = []; // games not yet in user's gamelist
        const unsavedGames : Array<string> = []; // games already saved

        return this.getUser(id).then((user) => {
            gameNames.forEach((gameName) => {
                if (user.hasGame(gameName)) {
                    savedGames.push(gameName);
                } else {
                    unsavedGames.push(gameName);
                }
            });

            return { savedGames, unsavedGames };
        })
    }

    /**
     * Save game/s to user's game list to database and then to the cache
     * @param id - id of the specified user
     * @param gameNames - name of the games to be saved
     */
    saveToUserGames(id : string, gameNames : Array<string>) : Promise<User> {
        return this.getUser(id).then((user) => {
            user.addGameNames(gameNames);
            return Users.findOneAndUpdate(
                { id },
                { gameNames: user.getGameNames() },
                { new: true }
            ).exec();
        }).then((rawUpdatedUser) => {
            const updatedUser = new User(rawUpdatedUser);

            if (this.isRedisEnabled) {
                const userKey = `user-${id}`;
                this.redisClient.set(userKey, JSON.stringify(updatedUser.getUserWrapper()));
            }

            return updatedUser;
        });
    }

    /**
     * Remove game/s from user's game list from database, and update cache
     * @param id - id of the specified user
     * @param gameNames - name of the games to be removed
     */
    removeFromUserGames(id : string, gameNames : Array<string>) : Promise<User> {
        return this.getUser(id).then((user) => {
            user.deleteGameNames(gameNames);
            return Users.findOneAndUpdate(
                { id },
                { gameNames: user.getGameNames() },
                { new: true }
            ).exec();
        }).then((rawUpdatedUser) => {
            const updatedUser = new User(rawUpdatedUser);

            if (this.isRedisEnabled) {
                const userKey = `user-${id}`;
                this.redisClient.set(userKey, JSON.stringify(updatedUser.getUserWrapper()));
            }

            return updatedUser;
        });
    }
};
