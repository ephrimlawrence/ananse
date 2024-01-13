import { Schema, model, Types } from "mongoose";

interface IPayment {
  id: Types.ObjectId;
  amount: number;
  policy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  id: { type: Schema.Types.ObjectId },
  amount: { type: Number, required: true },
  policy: { type: Schema.Types.ObjectId, required: true, ref: "Customer" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Payment = model<IPayment>("Payment", paymentSchema);
