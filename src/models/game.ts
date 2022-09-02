import { Schema, model } from 'mongoose';

interface IGame {
  name: string;
  roleId: string;
  limit: number;
  isInfinite: () => boolean;
};

export class Game implements IGame {
  name: string;
  roleId: string;
  limit: number = 5;

  constructor(game: IGame) {
    this.name = game.name;
    this.roleId = game.roleId;
    this.limit = game.limit;
  }

  isInfinite = () : boolean => this.limit === 0;
};

const gameSchema = new Schema<IGame>({
  name: String,
  roleId: String,
  limit: Number,
});

export default model<IGame>('Game', gameSchema);