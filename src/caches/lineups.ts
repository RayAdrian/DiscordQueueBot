import { Lineup, Lineups } from '../models';

export default class LineupsCache {
    private lineups: Map<string, Lineup>;

    constructor() {
        this.lineups = new Map<string, Lineup>();
    }

    /**
     * initialize empty lineups for a list of games
     * @param gameNames - list of games to make lineups for
     */
    initialize(gameNames : Array<string>) : void {
        gameNames.forEach((name) => {
            this.lineups.set(name, new Lineup(name, []));
        });
    }

    /**
     * Fetch lineups data from the database to save in the local cache
     */
    fetch() : void {
        Lineups.find({}).exec().then((data) => {
            const invalidLineups = [];
            data.forEach((lineup) => {
                const gameName = lineup.gameName;
                if (this.lineups.has(gameName)) {
                    this.lineups.get(gameName).addUsers(lineup.users);
                } else {
                    invalidLineups.push(lineup);
                }
            });
            if (invalidLineups.length > 0) {
                const invalidLineupIds = invalidLineups.map((lineup) => lineup._id);
                Lineups.deleteMany({ _id: { $in: invalidLineupIds } }).exec().then(() => {
                    const invalidLineupNames = invalidLineups.map((lineup) => lineup.gameName);
                    console.log('Deleted the following lineup ids:', invalidLineupNames.join());
                });
            }
        });
    }

    /**
     * Get the specified game's Lineup
     * @param name - name of the lineup to be retrieved
     */
    getLineup(name : string) : Lineup {
        return this.lineups.get(name);
    }

    /**
     * Get list of all the Lineup
     * @returns List of lineups per game
     */
    getLineups() : Array<Lineup> {
        const lineupsCopy = new Array<Lineup>();
        this.lineups.forEach((lineup) => {
            lineupsCopy.push(lineup);
        });
        return lineupsCopy;
    }

    /**
     * Get a specific list of Lineups
     * @param gameNames - list of names of game lineups to fetch
     * @returns List of lineups per game
     */
    getFilteredLineups(gameNames : Array<string>) : Array<Lineup> {
        const filteredLineups = new Array<Lineup>();
        this.lineups.forEach((lineup, gameName) => {
            if (gameNames.includes(gameName)) {
                filteredLineups.push(lineup);
            }
        })
        return filteredLineups;
    }

    /**
     * Get the lineups a user is part in
     * @param user
     */
    getUserLineups(user : string) : Array<Lineup> {
        const userLineups = new Array<Lineup>();
        this.lineups.forEach((lineup) => {
            if (lineup.hasUser(user)) {
                userLineups.push(lineup);
            }
        })
        return userLineups;
    }

    /**
     * Removes a lineup from the map ie. when a game is deleted.
     * @param name - name of the lineup to be deleted
     */
    removeLineup(name : string) : void {
        this.lineups.delete(name);
    }

    /**
     * Adds user/s to a specified lineup
     * @param name - game name of the specified lineup
     * @param users - user ids to be added to the lineup
     */
    addUsers = (name : string, users : Array<string>) : void => {
        this.lineups.get(name).addUsers(users);
    }

    /**
     * Adds a user to specified lineups
     * @param names - game names of the specified lineups
     * @param user - user id to be added to the lineup
     */
    joinLineups = (names : Array<string>, user : string) : void => {
        names.forEach((name) => this.lineups.get(name).addUser(user));
    }

    /**
     * Removes user/s from a specified lineup
     * @param name - game name of the specified lineup
     * @param users - user ids to be removed from the lineup
     */
    removeUsers(name : string, users : Array<string>) : void {
        const lineup = this.lineups.get(name).deleteUsers(users);
    }

    /**
     * Removes a user from the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param user - user id to be removed from the lineups
     */
    leaveLineups = (names : Array<string>, user : string) : void => {
        names.forEach((name) => this.lineups.get(name).deleteUser(user));
    }

    /**
     * Reset all lineups
     */
    resetAllLineups() : void {
        this.lineups.forEach((lineup) => lineup.clear());
    }

    /**
     * Reset specified lineups
     * @param names - list of names of game lineups to be reset
     */
    resetLineups(names : Array<string>) : void {
        names.forEach((name) => this.lineups.get(name).clear());
    }
};
