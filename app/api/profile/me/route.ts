import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getProfileByUserId } from "@/lib/profile";
import { getAuthenticatedUserFromCookies } from "@/lib/user-auth";

export async function GET() {
  const authenticatedUser = await getAuthenticatedUserFromCookies();
  if (!authenticatedUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const profile = await getProfileByUserId(String(authenticatedUser._id));
  if (!profile) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  return NextResponse.json(profile);
}
