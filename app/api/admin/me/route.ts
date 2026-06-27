import { NextResponse } from "next/server";
import { isAdminAccessGranted } from "@/lib/admin-auth";

export async function GET() {
  const authenticated = await isAdminAccessGranted();
  return NextResponse.json({ authenticated });
}
