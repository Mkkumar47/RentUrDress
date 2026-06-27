import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { signUserAuthToken, USER_AUTH_COOKIE_NAME } from "@/lib/user-auth";
import UserModel from "@/models/User";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email })
    .select("+password _id name email city phone avatarUrl role googleId")
    .lean();

  if (!user) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  if (!user.password) {
    return NextResponse.json(
      { message: "This account uses Google login. Continue with Google." },
      { status: 401 },
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const token = signUserAuthToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    message: "Login successful.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      city: user.city,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });

  response.cookies.set({
    name: USER_AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
