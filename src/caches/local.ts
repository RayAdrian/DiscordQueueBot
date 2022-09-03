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
    fetch = () => {
        this.gamesCache.fetch();
        // TODO: Add fetch for lineups
        // TODO: Add fetch for users
    };
};

