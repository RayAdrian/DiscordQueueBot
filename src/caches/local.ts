import GamesCache from './games.js';
import LineupsCache from './lineups.js';
import UsersCache from './users.js';

export default class LocalCache {
    gamesCache: GamesCache;
    lineupsCache: LineupsCache;
    usersCache: UsersCache;

    constructor() {
        this.gamesCache = new GamesCache();
        this.lineupsCache = new LineupsCache();
        this.usersCache = new UsersCache();
    }

    /**
     * Update local cache with data from the DB
     */
    fetchAll = () => {
        this.gamesCache.fetch().then(() => {
            this.initializeLineups();
            this.lineupsCache.fetch();
            this.usersCache.fetch();
        });
    };

    /**
     * Initialize lineups
     */
    initializeLineups = () => {
        return this.lineupsCache.initialize(this.gamesCache.getGameNames());
    };
};
