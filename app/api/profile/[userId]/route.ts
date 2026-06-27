import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getProfileByUserId } from "@/lib/profile";

type Context = {
  params: Promise<{ userId: string }>;
};

export async function GET(_: Request, context: Context) {
  const { userId } = await context.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ message: "Invalid user id." }, { status: 400 });
  }

  await connectToDatabase();
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  return NextResponse.json(profile);
}
