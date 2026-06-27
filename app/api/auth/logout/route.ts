import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { USER_AUTH_COOKIE_NAME } from "@/lib/user-auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully." });
  response.cookies.delete(USER_AUTH_COOKIE_NAME);
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
