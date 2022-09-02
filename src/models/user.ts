import { Schema, model } from 'mongoose';

interface IUser {
  id: string;
  games: string[];
};

const userSchema = new Schema<IUser>({
  id: String,
  games: [String]
});

export default model<IUser>('User', userSchema);