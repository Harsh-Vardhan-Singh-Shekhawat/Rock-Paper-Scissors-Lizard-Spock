import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGame extends Document {
  time: string;
  createdBy: string;
  createdFor: string;
  contractAddress: string;
  ethValue: string;
  isPlayed: boolean;
  winner: string;
  j1Timeout: boolean;
  j2Timeout: boolean;
}

const GameSchema: Schema<IGame> = new Schema({
  time: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdFor: { type: String, required: true },
  contractAddress: { type: String, required: true },
  ethValue: { type: String, required: true },
  isPlayed: { type: Boolean, default: false }, //update this when user b played the game and notify user a to find winner
  winner: { type: String, default: null },
  j1Timeout: { type: Boolean, default: false },
  j2Timeout: { type: Boolean, default: false },
});

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>("Game", GameSchema);

export default Game;
