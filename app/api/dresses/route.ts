import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import DressModel from "@/models/Dress";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const location = searchParams.get("location")?.trim();
  const featured = searchParams.get("featured");

  const query: Record<string, unknown> = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: regex }, { description: regex }, { brand: regex }];
  }

  if (location) {
    query["location.city"] = new RegExp(escapeRegex(location), "i");
  }

  if (featured === "true") {
    query.featured = true;
  }

  const dresses = await DressModel.find(query)
    .populate("owner", "name city")
    .sort({ featured: -1, createdAt: -1 })
    .limit(featured === "true" ? 8 : 100)
    .lean();

  return NextResponse.json({ dresses });
}
