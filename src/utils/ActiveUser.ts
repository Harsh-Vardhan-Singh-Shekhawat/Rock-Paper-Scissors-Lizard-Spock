import mongoose, { Document, Model, Schema } from "mongoose";

interface IActiveUser extends Document {
  address: string;
}

const ActiveUserSchema: Schema<IActiveUser> = new Schema({
  address: { type: String, required: true },
});

const ActiveUser: Model<IActiveUser> =
  mongoose.models.ActiveUser ||
  mongoose.model<IActiveUser>("ActiveUser", ActiveUserSchema);

export default ActiveUser;
