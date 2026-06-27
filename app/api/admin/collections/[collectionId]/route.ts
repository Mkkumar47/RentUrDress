import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { isAdminAccessGranted } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import CollectionModel from "@/models/Collection";

type Context = {
  params: Promise<{ collectionId: string }>;
};

type UpdateCollectionBody = {
  title?: string;
  material?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
};

function isValidImageInput(value: string) {
  if (!value) {
    return false;
  }
  if (value.startsWith("data:image/")) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(request: Request, context: Context) {
  const authenticated = await isAdminAccessGranted();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { collectionId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    return NextResponse.json({ message: "Invalid collection id." }, { status: 400 });
  }

  const body = (await request.json()) as UpdateCollectionBody;
  const title = body.title?.trim();
  const material = body.material?.trim();
  const category = body.category?.trim();
  const description = body.description?.trim();
  const imageUrl = body.imageUrl?.trim();

  const updateData: {
    title?: string;
    material?: string;
    category?: string;
    description?: string;
    imageUrl?: string;
  } = {};

  if (title) {
    updateData.title = title;
  }
  if (material) {
    updateData.material = material;
  }
  if (category) {
    updateData.category = category;
  }
  if (description) {
    updateData.description = description;
  }
  if (imageUrl) {
    if (!isValidImageInput(imageUrl)) {
      return NextResponse.json(
        { message: "Provide a valid image URL or uploaded image data." },
        { status: 400 },
      );
    }
    updateData.imageUrl = imageUrl;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: "No valid updates were provided." }, { status: 400 });
  }

  await connectToDatabase();
  const collection = await CollectionModel.findByIdAndUpdate(collectionId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("owner", "_id name city avatarUrl")
    .lean();

  if (!collection) {
    return NextResponse.json({ message: "Collection not found." }, { status: 404 });
  }

  return NextResponse.json({
    message: "Collection updated successfully.",
    collection,
  });
}

export async function DELETE(_: Request, context: Context) {
  const authenticated = await isAdminAccessGranted();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { collectionId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    return NextResponse.json({ message: "Invalid collection id." }, { status: 400 });
  }

  await connectToDatabase();
  const existingCollection = await CollectionModel.findById(collectionId)
    .select("_id")
    .lean();
  if (!existingCollection) {
    return NextResponse.json({ message: "Collection not found." }, { status: 404 });
  }

  await CollectionModel.deleteOne({ _id: collectionId });
  return NextResponse.json({ message: "Collection deleted successfully." });
}
