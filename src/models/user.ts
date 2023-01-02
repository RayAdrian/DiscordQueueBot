import mongoose from 'mongoose';

export interface IUser {
    id: string;
    gameNames: Array<string>;
};

export class User {
    private id: string;
    private gameNames: Set<string>;

    constructor(id : string, gameNames : Array<string> = []) {
        this.id = id;
        this.gameNames = new Set(gameNames);
    }

    getUserWrapper() : IUser {
        return {
            id: this.id,
            gameNames: [...this.gameNames],
        };
    }

    getId() : string {
        return this.id;
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

    clearGameNames() : void {
        this.gameNames.clear();
    }
}

const userSchema = new mongoose.Schema<IUser>({
    id: {
        type: String,
        required: true,
    },
    gameNames: {
        type: Array<String>,
        default: [],
    },
});

export default mongoose.model<IUser>('User', userSchema);