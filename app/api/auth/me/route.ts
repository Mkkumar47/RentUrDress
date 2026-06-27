import { NextResponse } from "next/server";
import { getAuthenticatedUserFromCookies } from "@/lib/user-auth";

export async function GET() {
  const user = await getAuthenticatedUserFromCookies();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({ authenticated: true, user });
}
