import mongoose from 'mongoose';

interface IUser {
  id: string;
  games: string[];
};

const userSchema = new mongoose.Schema<IUser>({
  id: String,
  games: [String]
});

export default mongoose.model<IUser>('User', userSchema);