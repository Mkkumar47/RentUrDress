import { cookies } from "next/headers";
import { getAuthenticatedUserFromCookies } from "@/lib/user-auth";

export const ADMIN_USERNAME = "mani";
export const ADMIN_PASSWORD = "Mani@123";
export const ADMIN_COOKIE_NAME = "renturdress_admin_session";
export const ADMIN_COOKIE_VALUE = "authenticated_admin";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}

export async function isAdminAccessGranted() {
  const adminCookieAuthenticated = await isAdminAuthenticated();
  if (adminCookieAuthenticated) {
    return true;
  }

  const authenticatedUser = await getAuthenticatedUserFromCookies();
  return authenticatedUser?.role === "admin";
}
