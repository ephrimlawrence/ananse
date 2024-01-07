import { Schema, model, Types } from "mongoose";

export interface IUser {
  id: Types.ObjectId;
  first_name: string;
  last_name: string;
  age: string;
  phone_number: string;
  pin: string;
}

const customerSchema = new Schema<IUser>({
  id: { type: Schema.Types.ObjectId },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: String, required: true },
  phone_number: { type: String, required: true },
  pin: { type: String, required: true },
});

export const Customer = model<IUser>("Customer", customerSchema);
