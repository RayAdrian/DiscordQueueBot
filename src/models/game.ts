import mongoose from 'mongoose';

export interface IGame {
    name: string;
    roleId: string;
    limit: number;
};

export class Game {
    private name: string;
    private roleId: string;
    private limit: number = 5;

    constructor(game: IGame) {
        this.name = game.name;
        this.roleId = game.roleId;
        this.limit = game.limit;
    }

    getGameWrapper() : IGame {
        return {
            name: this.name,
            roleId: this.roleId,
            limit: this.limit,
        };
    }

    getName() : string {
        return this.name;
    }

    getRoleId() : string {
        return this.roleId;
    }

    getLimit() : number {
        return this.limit;
    }

    isInfinite() : boolean {
        return this.limit === 0;
    }
};

const gameSchema = new mongoose.Schema<IGame>({
    name: String,
    roleId: String,
    limit: Number,
});

export default mongoose.model<IGame>('Game', gameSchema);