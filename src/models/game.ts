import mongoose from 'mongoose';

interface IGame {
    name: string;
    roleId: string;
    limit: number;
};

interface IGameMethods {
    isInfinite(): boolean;
}

type GameModel = mongoose.Model<IGame, {}, IGameMethods>;

export class Game implements IGame, IGameMethods {
    name: string;
    roleId: string;
    limit: number = 5;
    /**
     * Returns whether this game has infinite slots based on limit
     */
    isInfinite() : boolean {
        return this.limit === 0;
    }

    constructor(game: IGame) {
        this.name = game.name;
        this.roleId = game.roleId;
        this.limit = game.limit;
    }
};

const gameSchema = new mongoose.Schema<IGame, GameModel, undefined, IGameMethods>({
    name: String,
    roleId: String,
    limit: Number,
});
gameSchema.method('isInfinite', function isInfinite() {
    return this.limit === 0;
});

export default mongoose.model<IGame, GameModel>('Game', gameSchema);