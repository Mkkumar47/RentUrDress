import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const USER_AUTH_COOKIE_NAME = "renturdress_user_session";

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const pathnameWithSearch = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", pathnameWithSearch);
  return loginUrl;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasUserSession = Boolean(request.cookies.get(USER_AUTH_COOKIE_NAME)?.value);

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (hasUserSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!hasUserSession) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
