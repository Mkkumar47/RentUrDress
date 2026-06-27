import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import UserModel from "@/models/User";

export const USER_AUTH_COOKIE_NAME = "renturdress_user_session";

type UserRole = "user" | "admin";

export type UserAuthTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "renturdress-dev-jwt-secret-change-me";
}

export function signUserAuthToken(payload: Omit<UserAuthTokenPayload, "iat" | "exp">) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyUserAuthToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as UserAuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getUserAuthTokenPayloadFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyUserAuthToken(token);
}

export async function getAuthenticatedUserFromCookies() {
  const tokenPayload = await getUserAuthTokenPayloadFromCookies();
  if (!tokenPayload?.sub) {
    return null;
  }

  await connectToDatabase();
  const user = await UserModel.findById(tokenPayload.sub)
    .select("_id name email city phone avatarUrl role")
    .lean();
  return user;
}
