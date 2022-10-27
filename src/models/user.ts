import mongoose from 'mongoose';

export interface IUser {
    name: string;
    gameNames: Array<string>;
};

export class User {
    private name: string;
    private gameNames: Set<string>;

    constructor(name : string, gameNames : Array<string> = []) {
        this.name = name;
        this.gameNames = new Set(gameNames);
    }

    getUserWrapper() : IUser {
        return {
            name: this.name,
            gameNames: [...this.gameNames],
        }
    }

    getName() : string {
        return this.name;
    }

    getGameNames() : Array<string> {
        return [...this.gameNames];
    }

    hasGame(gameName : string) : boolean {
        return this.gameNames.has(gameName);
    }

    addGameNames(gameNames : Array<string>) : void {
        gameNames.forEach((gameName) => this.gameNames.add(gameName));
    }

    deleteGameNames(gameNames : Array<string>) : void {
        gameNames.forEach((gameName) => this.gameNames.delete(gameName));
    }

    clear() : void {
        this.gameNames.clear();
    }
}

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    gameNames: {
        type: Array<String>,
        default: [],
    },
});

export default mongoose.model<IUser>('User', userSchema);