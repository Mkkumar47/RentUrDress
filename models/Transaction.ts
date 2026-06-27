import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const transactionSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: {
      type: String,
      enum: ["PHONEPE"],
      default: "PHONEPE",
    },
    providerTransactionId: { type: String },
    merchantTransactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "PENDING",
    },
    simulated: { type: Boolean, default: true },
    paymentResponse: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type TransactionDocument = InferSchemaType<typeof transactionSchema> & {
  _id: string;
};

const TransactionModel = (mongoose.models.Transaction as Model<TransactionDocument>) ||
  mongoose.model<TransactionDocument>("Transaction", transactionSchema);

export default TransactionModel;
