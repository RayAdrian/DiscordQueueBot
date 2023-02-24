import { RedisClientType } from 'redis';
import { Lineups, Lineup, ILineup } from '../models/index.js';
import GameService from './gameService.js';

export default class LineupService {
    private redisClient: RedisClientType;
    private isRedisEnabled: boolean = false;
    private gameService: GameService;

    constructor(redisClient : RedisClientType) {
        this.redisClient = redisClient;
    }

    init(gameService : GameService) : void {
        this.gameService = gameService;
    }

    enableRedisClient() : void {
        if (this.redisClient) {
            this.isRedisEnabled = true;
        }
    }

    /**
     * Get the specified game's Lineup
     * @param gameName - game name of the Lineup to be retrieved
     * @returns Promise of the requested Lineup
     */
    getLineup(gameName : string) : Promise<Lineup> {
        let fetchingCached : Promise<Lineup> = Promise.resolve(null);
        const lineupKey = `lineup-${gameName}`;
        if (this.isRedisEnabled) {
            fetchingCached = this.redisClient.get(lineupKey).then((cachedLineup) => {
                if (cachedLineup) {
                    return new Lineup(JSON.parse(cachedLineup));
                }
                return null;
            });
        }
    
        return fetchingCached.then((lineup) => {
            if (lineup) {
                return Promise.resolve(lineup);
            }
            return Lineups.findOne({ gameName }).then(
                (rawLineup) => new Lineup(rawLineup),
            ).then((lineup) => {
                const asyncOperations : Array<Promise<any>> = [];
                if (this.isRedisEnabled) {
                    const wrappedLineup = lineup.getLineupWrapper();
                    asyncOperations.push(this.redisClient.set(lineupKey, JSON.stringify(wrappedLineup)));
                }
                return Promise.allSettled(asyncOperations).then(() => lineup);
            });
        }).then((lineup) => lineup);
    }

    /**
     * Get list of all the Lineup
     * @returns Promise of a list of all the Lineups
     */
    getLineups() : Promise<Array<Lineup>> {
        let fetchingCached : Promise<Array<Lineup>> = Promise.resolve(null);
        const lineupsKey = `lineups`;
        if (this.isRedisEnabled) {
            fetchingCached = this.redisClient.get(lineupsKey).then((cachedLineups) => {
                if (cachedLineups) {
                    const rawLineups = JSON.parse(cachedLineups);
                    return rawLineups.map((rawLineup) => new Lineup(rawLineup));
                }
                return null;
            });
        }
    
        return fetchingCached.then((lineups) => {
            if (lineups !== null) {
                return Promise.resolve(lineups);
            }
            return Lineups.find().then((rawLineups) => {
                return rawLineups.map((rawLineup) => new Lineup(rawLineup));
            }).then((lineups) => {
                const asyncOperations : Array<Promise<any>> = [];
                if (this.isRedisEnabled) {
                    const wrappedLineups = lineups.map((lineup) => lineup.getLineupWrapper());
                    asyncOperations.push(this.redisClient.set(lineupsKey, JSON.stringify(wrappedLineups)));
                }
                return Promise.allSettled(asyncOperations).then(() => lineups);
            })
        }).then((lineups) => lineups);
    }
        
    /**
     * Get a specific list of Lineups
     * @param gameNames - game names of the specified Lineups
     * @returns Promise of a list of the specified Lineups
     */
    getFilteredLineups(gameNames : Array<string>) : Promise<Array<Lineup>> {
        return this.getLineups().then((lineups) => {
            return lineups.filter((lineup) => gameNames.includes(lineup.getGameName()));
        });
    }

    /**
     * Get the Lineups a user is part in
     * @param user
     * @returns Promise of a list of Lineups the specified user is in
     */
    getUserLineups(user : string) : Promise<Array<Lineup>> {
        return this.getLineups().then((lineups) => {
            return lineups.filter((lineup) => lineup.hasUser(user));
        });
    }

    /**
     * Add a Lineup for a game
     * @param gameName - game name of the Lineup to be created
     * @returns Promise of the created Lineup
     */
    addLineup(gameName : string) : Promise<Lineup> {
        return Lineups.create(
            { gameName, users: [] },
        ).then((rawLineup) => {
            const newLineup = new Lineup(rawLineup);
            const newLineupWrapper = newLineup.getLineupWrapper();
            const asyncOperations : Array<Promise<any>> = [];

            if (this.isRedisEnabled) {
                const lineupKey = `lineup-${gameName}`;
                const lineupsKey = 'lineups';

                asyncOperations.push(this.redisClient.set(lineupKey, JSON.stringify(newLineupWrapper)));
                asyncOperations.push(this.redisClient.get(lineupsKey).then((cachedLineups) => {
                    if (cachedLineups !== null) {
                        const iLineups : Array<ILineup> = JSON.parse(cachedLineups);
                        iLineups.push(newLineupWrapper);
                        this.redisClient.set(lineupsKey, JSON.stringify(iLineups));
                    }
                }));
            }

            return Promise.allSettled(asyncOperations).then(() => newLineup);
        });
    }

    /**
     * Removes a Lineup from the map ie. when a game is deleted.
     * @param gameName - game name of the Lineup to be deleted
     * @returns Promise of the deleted Lineup
     */
    removeLineup(gameName : string) : Promise<Lineup> {
        return Lineups.findOneAndDelete(
            { gameName },
        ).exec().then((rawLineup) => {
            const deletedLineup = new Lineup(rawLineup);
            const asyncOperations : Array<Promise<any>> = [];

            if (this.isRedisEnabled) {
                const lineupKey = `lineup-${gameName}`;
                const lineupsKey = 'lineups';

                asyncOperations.push(this.redisClient.del(lineupKey));
                asyncOperations.push(this.redisClient.get(lineupsKey).then((cachedLineups) => {
                    if (cachedLineups !== null) {
                        const iLineups : Array<ILineup> = JSON.parse(cachedLineups);

                        const lineupIndex = iLineups.findIndex(
                            ({ gameName }) => gameName === deletedLineup.getGameName(),
                        );
                        if (lineupIndex != -1) {
                            iLineups.splice(lineupIndex, 1);
                        }

                        this.redisClient.set(lineupsKey, JSON.stringify(iLineups));
                    }
                }));
            }

            return Promise.allSettled(asyncOperations).then(() => deletedLineup);
        });
    }

    /**
     * Adds user/s to a specified Lineup
     * @param gameName - game name of the specified Lineup
     * @param users - user ids to be added to the Lineup
     * @returns Promise of the deleted Lineup
     */
    addUsers = (gameName : string, users : Array<string>) : Promise<{
        lineup : Lineup,
        validUsers : Array<string>,
        invalidUsers : Array<string>,
        excludedUsers : Array<string>,
    }> => {
        const validUsers = []; // not in lineup
        const invalidUsers = []; // already in lineup
        let excludedUsers = []; // cannot be added due to full lineup

        const fetchingGame = this.gameService.getGame(gameName);
        const fetchingLineup = this.getLineup(gameName);

        return Promise.all([fetchingGame, fetchingLineup]).then(([game, lineup]) => {
            const remainingSlotsCount = game.getLimit() - lineup.getUserCount();
            if (remainingSlotsCount <= 0) {
                return Promise.reject(`Lineup for \`${gameName}\` already full.`);
            }

            users.forEach((user) => (lineup.hasUser(user) ? invalidUsers : validUsers).push(user));
            excludedUsers = validUsers.splice(remainingSlotsCount);

            // arguments validated
            lineup.addUsers(validUsers);
            return Lineups.findOneAndUpdate(
                { gameName },
                { users: lineup.getUsers() },
                { new: true },
            ).exec();
        }).then(
            (rawUpdatedLineup) => new Lineup(rawUpdatedLineup),
        ).then((updatedLineup) => {
            const updatedLineupWrapper = updatedLineup.getLineupWrapper();
            const asyncOperations : Array<Promise<any>> = [];

            if (this.isRedisEnabled) {
                const lineupKey = `lineup-${gameName}`;
                const lineupsKey = 'lineups';

                asyncOperations.push(this.redisClient.set(lineupKey, JSON.stringify(updatedLineupWrapper)));
                asyncOperations.push(this.redisClient.get(lineupsKey).then((cachedLineups) => {
                    if (cachedLineups !== null) {
                        const iLineups : Array<ILineup> = JSON.parse(cachedLineups);

                        const lineupIndex = iLineups.findIndex(
                            ({ gameName }) => gameName === updatedLineup.getGameName(),
                        );
                        if (lineupIndex != -1) {
                            iLineups[lineupIndex] = updatedLineupWrapper;
                        }

                        this.redisClient.set(lineupsKey, JSON.stringify(iLineups));
                    }
                }));
            }

            return Promise.allSettled(asyncOperations).then(() => ({
                lineup: updatedLineup,
                validUsers,
                invalidUsers,
                excludedUsers,
            }));
        });
    }
};
