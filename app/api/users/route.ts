import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import UserModel from "@/models/User";

export async function GET() {
  await connectToDatabase();

  const users = await UserModel.find({})
    .select("_id name email city phone avatarUrl role")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users });
}
