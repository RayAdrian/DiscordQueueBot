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

    userHasGame(user : string, gameName : string) : boolean {
        return this.usersMap.has(user) ? this.usersMap.get(user).hasGame(gameName) : false;
    }
};
