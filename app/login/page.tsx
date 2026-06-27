"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchWithLoader } from "@/lib/client-api";
import { clearClientSessionStorage } from "@/lib/client-session";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonOptions = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  logo_alignment?: "left" | "center";
};

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
          prompt: (listener?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const shouldForceGooglePrompt = searchParams.get("google") === "1";
  const nextPath = useMemo(() => {
    const requestedPath = searchParams.get("next");
    if (
      requestedPath &&
      requestedPath.startsWith("/") &&
      !requestedPath.startsWith("//") &&
      !requestedPath.startsWith("/api") &&
      !requestedPath.startsWith("/admin")
    ) {
      return requestedPath;
    }
    return "/dashboard";
  }, [searchParams]);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setGoogleSubmitting(true);
      setMessage("");

      const response = await fetchWithLoader("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Google login failed.");
        setGoogleSubmitting(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    },
    [nextPath, router],
  );

  useEffect(() => {
    clearClientSessionStorage();
    fetchWithLoader("/api/auth/logout", { method: "POST" }).catch(() => {
      return;
    });
  }, []);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    let active = true;
    const scriptSource = "https://accounts.google.com/gsi/client";

    const initializeGoogleSignIn = () => {
      if (!active || !window.google?.accounts.id || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          if (!credential) {
            setMessage("Google sign-in did not return a valid credential.");
            return;
          }
          void handleGoogleCredential(credential);
        },
        auto_select: true,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          return;
        }
      });
    };

    const existingScript = document.querySelector(
      `script[src="${scriptSource}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.accounts.id) {
        initializeGoogleSignIn();
      } else {
        existingScript.addEventListener("load", initializeGoogleSignIn);
      }
      return () => {
        active = false;
        existingScript.removeEventListener("load", initializeGoogleSignIn);
      };
    }

    const script = document.createElement("script");
    script.src = scriptSource;
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      active = false;
      script.onload = null;
    };
  }, [googleClientId, handleGoogleCredential, shouldForceGooglePrompt]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const response = await fetchWithLoader("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      setMessage(data.message ?? "Login failed.");
      setSubmitting(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-white">User Login</CardTitle>
          <CardDescription>
            Sign in with Google for auto account creation, or use seeded credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-xl border border-white/15 bg-slate-900/65 p-4">
            <p className="text-sm font-medium text-slate-200">Continue with Google</p>
            {googleClientId ? (
              <div className="flex flex-col gap-2">
                <div ref={googleButtonRef} className="min-h-10" />
                {googleSubmitting ? (
                  <p className="text-xs text-cyan-200">Signing in with Google...</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-amber-200">
                Add NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local to enable Google login.
              </p>
            )}
          </div>

          <div className="relative py-1">
            <div className="h-px bg-white/10" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#040912] px-2 text-xs text-slate-400">
              or
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="rounded-xl border border-white/15 bg-slate-900/65 p-3 text-xs text-slate-200" hidden>
            <p className="font-semibold">Demo credentials</p>
            <p>Admin user: mani@renturdress.com / Mani@123</p>
            <p>Other users: any seeded email / Rent@123</p>
          </div>

          {message ? <p className="text-sm text-rose-200">{message}</p> : null}

          <p className="text-sm text-slate-300">
            Need admin controls? Go to{" "}
            <Link href="/admin" className="text-cyan-300 underline-offset-2 hover:underline">
              /admin
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
