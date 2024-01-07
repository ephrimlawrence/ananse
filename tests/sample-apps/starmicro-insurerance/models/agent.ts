import { Schema, model, Types } from "mongoose";
import { IUser } from "./customer";

const agentSchema = new Schema<IUser>({
  id: { type: Schema.Types.ObjectId },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: String, required: true },
  phone_number: { type: String, required: true },
  pin: { type: String, required: true },
});

export const Agent = model<IUser>("Agent", agentSchema);
