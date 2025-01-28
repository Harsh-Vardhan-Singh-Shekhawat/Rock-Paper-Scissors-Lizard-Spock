import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGame extends Document {
  time: string;
  createdBy: string;
  createdFor: string;
  contractAddress: string;
}

const GameSchema: Schema<IGame> = new Schema({
  time: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdFor: { type: String, required: true },
  contractAddress: { type: String, required: true },
});

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>("Game", GameSchema);

export default Game;
