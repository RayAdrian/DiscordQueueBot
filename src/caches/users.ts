import { Document } from 'mongoose';
import { Users, User, IUser } from '../models';

export default class UsersCache {
    usersMap: Map<string, User>;

    constructor() {
        this.usersMap = new Map<string, User>();
    }

    fetch() : Promise<void> {
        return Users.find({}).exec().then((data) => {
            data.forEach(({ name, gameNames }) => {
                this.usersMap.set(name, new User(name, gameNames));
            });
        });
    }

    saveToUserGames(user : string, gameNames : Array<string>) : Promise<IUser & Document<any, any, IUser>> {
        if (this.usersMap.has(user)) {
            this.usersMap.get(user).addGameNames(gameNames);
            return Users.findOneAndUpdate(
                { user },
                { gameNames: this.usersMap.get(user).getGameNames() }
            ).exec();
        }

        const newUser = new User(user, gameNames);
        this.usersMap.set(user, newUser);
        return Users.create(newUser.getUserWrapper());
    }

    confirmUserInit(user : string) : Promise<void> {
        if (this.usersMap.has(user)) {
            return Promise.resolve();
        }
        const newUser = new User(user, []);
        this.usersMap.set(user, newUser);
        return Users.create(newUser.getUserWrapper()).then(() => {});
    }

    /**
     * Split games into games that the user has saved, and games that they have not.
     * @param user - the specified user
     * @param gameNames - the list of games to process
     * @returns An object containing 2 arrays, one for saved games, and the other for unsaved games.
     */
     processIfUserHasGames(
        user : string, gameNames : Array<string>,
    ) : { savedGames: Array<string>; unsavedGames: Array<string>; } {
        const savedGames : Array<string> = []; // games not yet in user's gamelist
        const unsavedGames : Array<string> = []; // games already saved

        gameNames.forEach((gameName) => {
            if (this.usersMap.get(user).hasGame(gameName)) {
                unsavedGames.push(gameName);
            } else {
                savedGames.push(gameName);
            }
        });

        return { savedGames, unsavedGames };
    }
};
