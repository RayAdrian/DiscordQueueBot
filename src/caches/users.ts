import { Document } from 'mongoose';
import { Users, User, IUser } from '../models';

export default class UsersCache {
    usersMap: Map<string, User>;

    constructor() {
        this.usersMap = new Map<string, User>();
    }

    fetch() : Promise<void> {
        return Users.find({}).exec().then((data) => {
            data.forEach(({ id, gameNames }) => {
                this.usersMap.set(id, new User(id, gameNames));
            });
        });
    }

    getUserGames(id : string) : Array<string> {
        return this.usersMap.get(id).getGameNames();
    }

    saveToUserGames(id : string, gameNames : Array<string>) : Promise<IUser & Document<any, any, IUser>> {
        this.usersMap.get(id).addGameNames(gameNames);
        return Users.findOneAndUpdate(
            { id },
            { gameNames: this.usersMap.get(id).getGameNames() }
        ).exec();
    }

    removeFromUserGames(id : string, gameNames : Array<string>) : Promise<IUser & Document<any, any, IUser>> {
        this.usersMap.get(id).deleteGameNames(gameNames);
        return Users.findOneAndUpdate(
            { id },
            { gameNames: this.usersMap.get(id).getGameNames() }
        ).exec();
    }

    confirmUserInit(id : string) : Promise<void> {
        if (this.usersMap.has(id)) {
            return Promise.resolve();
        }
        const newUser = new User(id, []);
        this.usersMap.set(id, newUser);
        return Users.create(newUser.getUserWrapper()).then(() => {});
    }

    /**
     * Split games into games that the user has saved, and games that they have not.
     * @param id - id of the specified user
     * @param gameNames - the list of games to process
     * @returns An object containing 2 arrays, one for saved games, and the other for unsaved games.
     */
    processIfUserHasGames(
        id : string, gameNames : Array<string>,
    ) : { savedGames: Array<string>; unsavedGames: Array<string>; } {

        const savedGames : Array<string> = []; // games not yet in user's gamelist
        const unsavedGames : Array<string> = []; // games already saved

        const userGames : User = this.usersMap.get(id);

        gameNames.forEach((gameName) => {
            if (userGames.hasGame(gameName)) {
                savedGames.push(gameName);
            } else {
                unsavedGames.push(gameName);
            }
        });

        return { savedGames, unsavedGames };
    }
};
