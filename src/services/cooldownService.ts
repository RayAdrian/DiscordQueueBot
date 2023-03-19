import { RedisClientType } from 'redis';

export default class CooldownService {
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
     * Add a cooldown to a command to prevent spam
     * @param user - id of user who issued command
     * @param command - name of the relevant command
     * @param duration - cooldown in milliseconds
     */
    addCooldown(user, command, duration) : Promise<any> {
        const key = `${user}-${command}`;
        const endTime = new Date(Date.now() + duration);
        if (this.isRedisEnabled) {
            return this.redisClient.set(key, endTime.toISOString());
        } 
        return Promise.reject("Redis cache cannot be accessed.");
    }

    /**
     * Retrieve the cooldown of a command
     * @param user - id of user who issued command
     * @param command - name of the relevant command
     */
    getCooldown(user, command) : Promise<Date> {
        const key = `${user}-${command}`;
        if (this.isRedisEnabled) {
            return this.redisClient.get(key).then(async (dateString) => {
                return new Date(dateString);
            });
        } 
        return Promise.reject("Redis cache cannot be accessed.");
    }
};
