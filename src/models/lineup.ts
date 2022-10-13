import mongoose from 'mongoose';

export class Lineup {
    private gameName: string;
    private users: Set<string>;

    constructor(gameName : string, users : Array<string>) {
        this.gameName = gameName;
        this.users = new Set(...users);
    }

    getGameName() : string {
        return this.gameName;
    }

    getUsers() : Array<string> {
        return [...this.users];
    }

    getUserCount() : number {
        return this.users.size;
    }

    hasUser(user : string) : boolean {
        return this.users.has(user);
    }

    addUser(newUser : string) : void {
        this.users.add(newUser);
    }

    addUsers(newUsers : Array<string>) : void {
        newUsers.forEach((newUser) => this.users.add(newUser));
    }

    deleteUser(newUser : string) : void {
        this.users.delete(newUser);
    }

    deleteUsers(newUsers : Array<string>) : void {
        newUsers.forEach((newUser) => this.users.delete(newUser));
    }

    clear() : void {
        this.users.clear();
    }
};


interface ILineup {
    game: mongoose.Types.ObjectId;
    lineup: Array<string>;
};

const lineupSchema = new mongoose.Schema<ILineup>({
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
    },
    lineup: {
        type: Array<String>,
        required: true,
    },
});

export default mongoose.model<ILineup>('Lineup', lineupSchema);