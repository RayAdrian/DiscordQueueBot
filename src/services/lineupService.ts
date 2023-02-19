import { RedisClientType } from 'redis';
import { Lineups, Lineup } from '../models/index.js';

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
                    console.log(`${lineupKey} hit`);
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
                if (this.isRedisEnabled) {
                    console.log(`caching ${lineupKey}`);
                    const wrappedLineup = lineup.getLineupWrapper();
                    this.redisClient.set(lineupKey, JSON.stringify(wrappedLineup));
                }
                return lineup;
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
                    console.log(`${lineupsKey} hit`);
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
                if (this.isRedisEnabled) {
                    console.log(`caching ${lineupsKey}`);
                    const wrappedLineups = lineups.map((lineup) => lineup.getLineupWrapper());
                    this.redisClient.set(lineupsKey, JSON.stringify(wrappedLineups));
                }
                return lineups;
            })
        }).then((lineups) => lineups);
    }
};
