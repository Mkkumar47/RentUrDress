import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const collectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CollectionDocument = InferSchemaType<typeof collectionSchema> & { _id: string };

const CollectionModel = (mongoose.models.Collection as Model<CollectionDocument>) ||
  mongoose.model<CollectionDocument>("Collection", collectionSchema);

export default CollectionModel;
