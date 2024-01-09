import { Schema, model, Types } from "mongoose";

interface IPolicy {
  id: Types.ObjectId;
  name: string;
  premium: number;
  customer: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicy>({
  id: { type: Schema.Types.ObjectId },
  name: { type: String, required: true },
  premium: { type: Number, required: true },
  customer: { type: Schema.Types.ObjectId, required: true, ref: "Customer" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Policy = model<IPolicy>("Policy", policySchema);
