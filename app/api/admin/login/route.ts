import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_VALUE,
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim();
  const password = body.password?.trim();

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { message: "Invalid admin credentials." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    message: "Admin login successful.",
    authenticated: true,
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: ADMIN_COOKIE_VALUE,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}
