import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getAuthenticatedUserFromCookies } from "@/lib/user-auth";
import CollectionModel from "@/models/Collection";

type CollectionBody = {
  title?: string;
  material?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  const query: Record<string, unknown> = { isPublic: true };
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { title: regex },
      { material: regex },
      { category: regex },
      { description: regex },
    ];
  }

  const collections = await CollectionModel.find(query)
    .populate("owner", "_id name city avatarUrl")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromCookies();
  if (!authenticatedUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CollectionBody;
  const title = body.title?.trim();
  const material = body.material?.trim();
  const category = body.category?.trim();
  const description = body.description?.trim();
  const imageUrl = body.imageUrl?.trim();

  if (!title || !material || !category || !description || !imageUrl) {
    return NextResponse.json(
      { message: "Title, material, category, description and image are required." },
      { status: 400 },
    );
  }

  if (!isValidImageInput(imageUrl)) {
    return NextResponse.json(
      { message: "Provide a valid image URL or uploaded image data." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const created = await CollectionModel.create({
    title,
    material,
    category,
    description,
    imageUrl,
    owner: authenticatedUser._id,
    isPublic: true,
  });

  const collection = await CollectionModel.findById(created._id)
    .populate("owner", "_id name city avatarUrl")
    .lean();

  return NextResponse.json(
    {
      message: "Collection added successfully.",
      collection,
    },
    { status: 201 },
  );
}
