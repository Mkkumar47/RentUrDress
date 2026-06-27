import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const dressSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    dailyRent: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    location: {
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      landmark: { type: String, required: true, trim: true },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAvailable: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

export type DressDocument = InferSchemaType<typeof dressSchema> & { _id: string };

const DressModel = (mongoose.models.Dress as Model<DressDocument>) ||
  mongoose.model<DressDocument>("Dress", dressSchema);

export default DressModel;
