import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { signUserAuthToken, USER_AUTH_COOKIE_NAME } from "@/lib/user-auth";
import UserModel from "@/models/User";

type GoogleLoginBody = {
  credential?: string;
};

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
}

function getDefaultAvatar(email: string) {
  const encoded = encodeURIComponent(email);
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encoded}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GoogleLoginBody;
  const credential = body.credential?.trim();
  const clientId = getGoogleClientId();

  if (!credential) {
    return NextResponse.json({ message: "Google credential is required." }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json(
      { message: "Google login is not configured on the server." },
      { status: 500 },
    );
  }

  const googleClient = new OAuth2Client(clientId);
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
  } catch {
    return NextResponse.json({ message: "Invalid Google credential." }, { status: 401 });
  }
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return NextResponse.json({ message: "Google account is not verified." }, { status: 401 });
  }

  await connectToDatabase();

  const email = payload.email.trim().toLowerCase();
  const defaultName = payload.name?.trim() || email.split("@")[0];
  const defaultAvatar = payload.picture?.trim() || getDefaultAvatar(email);

  let user = await UserModel.findOne({
    $or: [{ googleId: payload.sub }, { email }],
  }).select("_id name email city phone avatarUrl role googleId");

  if (!user) {
    user = await UserModel.create({
      name: defaultName,
      email,
      googleId: payload.sub,
      city: "Unknown",
      phone: "Not provided",
      avatarUrl: defaultAvatar,
      role: "user",
    });
  } else {
    if (!user.googleId) {
      user.googleId = payload.sub;
    }
    if (!user.avatarUrl && defaultAvatar) {
      user.avatarUrl = defaultAvatar;
    }
    if (!user.name && defaultName) {
      user.name = defaultName;
    }
    await user.save();
  }

  const token = signUserAuthToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    message: "Google login successful.",
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
