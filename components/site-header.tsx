"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { fetchWithLoader, subscribeApiLoader } from "@/lib/client-api";
import { clearClientSessionStorage } from "@/lib/client-session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthState = {
  authenticated: boolean;
  user: {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
  } | null;
};

const navItemsByRole: Record<"user" | "admin", { href: string; label: string }[]> = {
  user: [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/collections", label: "Collections" },
    { href: "/profile", label: "Profile" },
  ],
  admin: [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/collections", label: "Collections" },
    { href: "/profile", label: "Profile" },
    { href: "/admin", label: "Admin" },
  ],
};

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    async function loadAuth() {
      const response = await fetchWithLoader("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as AuthState;
      setAuthState(data);
    }

    loadAuth().catch(() => {
      setAuthState({ authenticated: false, user: null });
    });
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = subscribeApiLoader((loading) => {
      setIsApiLoading(loading);
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = useMemo(() => authState.authenticated, [authState.authenticated]);
  const role = authState.user?.role;
  const navItems = useMemo(() => {
    if (!isAuthenticated || !role) {
      return [];
    }
    return navItemsByRole[role];
  }, [isAuthenticated, role]);
  const showRoleNavigation = navItems.length > 0;
  const isRouteLoading = Boolean(pendingNavHref && pendingNavHref !== pathname);
  const showNavigationLoader = showRoleNavigation && (isRouteLoading || isApiLoading);

  function handleMenuNavigate(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      href === pathname
    ) {
      return;
    }

    setPendingNavHref(href);
  }

  async function handleLogout() {
    await fetchWithLoader("/api/auth/logout", { method: "POST" });
    clearClientSessionStorage();
    setAuthState({ authenticated: false, user: null });
    router.push("/login?google=1");
    router.refresh();
  }

  async function handleLoginClick() {
    await fetchWithLoader("/api/auth/logout", { method: "POST" });
    clearClientSessionStorage();
    setAuthState({ authenticated: false, user: null });
    router.push("/login?google=1");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
        >
          RentUrDress
        </Link>

        <div className="flex items-center gap-3">
          {showRoleNavigation ? (
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/55 p-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={(event) => handleMenuNavigate(event, item.href)}
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/10",
                        pathname === item.href ? "bg-white/15 text-white shadow-sm" : "",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-slate-300 sm:inline">
                Hi, {authState.user?.name} ({authState.user?.role})
              </span>
              <Button variant="secondary" className="h-9" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button className="h-9" onClick={handleLoginClick}>
              Login
            </Button>
          )}
        </div>
      </div>

      {showNavigationLoader ? (
        <div className="nav-loader-track" role="status" aria-live="polite">
          <div className="nav-loader-bar" />
        </div>
      ) : null}
    </header>
  );
}
