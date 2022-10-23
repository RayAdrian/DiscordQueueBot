import { Document, UpdateWriteOpResult } from 'mongoose';
import { ILineup, Lineup, Lineups } from '../models';

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
        gameNames.forEach((gameName) => {
            this.lineups.set(gameName, new Lineup(gameName, []));
        });
    }

    /**
     * Fetch lineups data from the database to save in the local cache
     */
    fetch() : Promise<{ missingLineups: ILineup[]; invalidLineups: (ILineup & Document<any, any, ILineup>)[]; }> {
        return Lineups.find({}).exec().then((data) => {
            // Check whether there are lineups in the cache that are not in the db
            const existingLineups = new Set(data.map(({ gameName }) => gameName));
            const missingLineups = [...this.lineups.keys()].filter(
                (gameName) => !existingLineups.has(gameName),
            ).map(
                (gameName) => this.lineups.get(gameName).getLineupWrapper(),
            );

            // Check whether there are lineups in the db that should not exist
            const invalidLineups : Array<ILineup & Document<any, any, ILineup>> = [];
            data.forEach((lineup) => {
                const gameName = lineup.gameName;
                if (this.lineups.has(gameName)) {
                    this.lineups.get(gameName).addUsers(lineup.users);
                } else {
                    invalidLineups.push(lineup);
                }
            });

            return {
                missingLineups,
                invalidLineups,  
            };
        });
    }

    /**
     * Get the specified game's Lineup
     * @param gameName - game name of the lineup to be retrieved
     */
    getLineup(gameName : string) : Lineup {
        return this.lineups.get(gameName);
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
     * @param gameNames - game names of the specified lineups
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
     * Add a lineup for a game
     * @param gameName - game name of the lineup to be created
     */
    addLineup(gameName : string) : Promise<ILineup & Document<any, any, ILineup>> {
        const newLineup = new Lineup(gameName, []);
        this.lineups.set(gameName, newLineup);
        return Lineups.create(newLineup);
    }

    /**
     * Removes a lineup from the map ie. when a game is deleted.
     * @param gameName - game name of the lineup to be deleted
     */
    removeLineup(gameName : string) : Promise<ILineup & Document<any, any, ILineup>> {
        this.lineups.delete(gameName);
        return Lineups.findOneAndDelete({ gameName }).exec();
    }

    /**
     * Adds user/s to a specified lineup
     * @param gameName - game name of the specified lineup
     * @param users - user ids to be added to the lineup
     */
    addUsers = (
        gameName : string, users : Array<string>,
    ) : Promise<ILineup & Document<any, any, ILineup>> => {
        this.lineups.get(gameName).addUsers(users);
        return Lineups.findOneAndUpdate(
            { gameName },
            { users: this.lineups.get(gameName).getUsers() }
        ).exec();
    }

    /**
     * Adds a user to specified lineups
     * @param gameNames - game names of the specified lineups
     * @param user - user id to be added to the lineup
     */
    joinLineups = (
        gameNames : Array<string>, user : string,
    ) : Promise<(ILineup & Document<any, any, ILineup>)[]> => {
        gameNames.forEach((gameName) => this.lineups.get(gameName).addUser(user));
        return Promise.all(gameNames.map((gameName) => {
            return Lineups.findOneAndUpdate(
                { gameName },
                { users: this.lineups.get(gameName).getUsers() },
            ).exec()
        }));
    }

    /**
     * Removes user/s from a specified lineup
     * @param gameName - game name of the specified lineup
     * @param users - user ids to be removed from the lineup
     */
    removeUsers(
        gameName : string, users : Array<string>,
    ) : Promise<ILineup & Document<any, any, ILineup>> {
        this.lineups.get(gameName).deleteUsers(users);
        return Lineups.findOneAndUpdate(
            { gameName },
            { users: this.lineups.get(gameName).getUsers() }
        ).exec();
    }

    /**
     * Removes a user from the specified lineups
     * @param gameNames - game names of the specified lineups
     * @param user - user id to be removed from the lineups
     */
    leaveLineups = (
        gameNames : Array<string>, user : string,
    ) : Promise<(ILineup & Document<any, any, ILineup>)[]> => {
        gameNames.forEach((gameName) => this.lineups.get(gameName).deleteUser(user));
        return Promise.all(gameNames.map((gameName) => {
            return Lineups.findOneAndUpdate(
                { gameName },
                { users: this.lineups.get(gameName).getUsers() },
            ).exec()
        }));
    }

    /**
     * Reset all lineups
     */
    resetAllLineups() : Promise<UpdateWriteOpResult> {
        this.lineups.forEach((lineup) => lineup.clear());
        return Lineups.updateMany(
            {},
            { users: [] },
        ).exec();
    }

    /**
     * Reset specified lineups
     * @param gameNames - list of names of game lineups to be reset
     */
    resetLineups(gameNames : Array<string>) : Promise<UpdateWriteOpResult> {
        gameNames.forEach((gameName) => this.lineups.get(gameName).clear());
        return Lineups.updateMany(
            { gameName: { $in: gameNames } },
            { users: [] },
        ).exec();
    }
};
