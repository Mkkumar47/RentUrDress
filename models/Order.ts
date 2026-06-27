import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const orderSchema = new Schema(
  {
    renter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dress: { type: Schema.Types.ObjectId, ref: "Dress", required: true },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["placed", "active", "completed", "cancelled"],
      default: "placed",
    },
    deliveryLocation: { type: String, required: true, trim: true },
    trackingCity: { type: String, required: true, trim: true },
    trackingLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  { timestamps: true },
);

export type OrderDocument = InferSchemaType<typeof orderSchema> & { _id: string };

const OrderModel = (mongoose.models.Order as Model<OrderDocument>) ||
  mongoose.model<OrderDocument>("Order", orderSchema);

export default OrderModel;
