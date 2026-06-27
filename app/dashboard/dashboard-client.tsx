"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DressCard } from "@/components/dress-card";
import { LocationMap } from "@/components/location-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DressGridSkeleton } from "@/components/ui/dress-grid-skeleton";
import { Input } from "@/components/ui/input";
import { LoadingScene } from "@/components/ui/loading-scene";
import { fetchWithLoader } from "@/lib/client-api";
import { ApiDress, ApiUser } from "@/types/api";

type AuthMeResponse = {
  authenticated: boolean;
  user: ApiUser | null;
};

type CheckoutResponse = {
  mode: "mock" | "real";
  message: string;
  redirectUrl?: string;
  merchantTransactionId?: string;
};

export function DashboardClient() {
  const [dresses, setDresses] = useState<ApiDress[]>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<"mock" | "real">("real");
  const [pendingTransactionId, setPendingTransactionId] = useState("");
  const [authState, setAuthState] = useState<AuthMeResponse>({
    authenticated: false,
    user: null,
  });

  async function fetchDresses(currentSearch: string, currentLocation: string) {
    const query = new URLSearchParams();
    if (currentSearch.trim()) query.set("search", currentSearch.trim());
    if (currentLocation.trim()) query.set("location", currentLocation.trim());

    const response = await fetchWithLoader(`/api/dresses?${query.toString()}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as { dresses: ApiDress[] };
    setDresses(data.dresses ?? []);
  }

  useEffect(() => {
    async function loadInitialData() {
      const [authResponse, dressesResponse] = await Promise.all([
        fetchWithLoader("/api/auth/me", { cache: "no-store" }),
        fetchWithLoader("/api/dresses", { cache: "no-store" }),
      ]);

      const authData = (await authResponse.json()) as AuthMeResponse;
      const dressesData = (await dressesResponse.json()) as { dresses: ApiDress[] };

      setAuthState(authData);
      setDresses(dressesData.dresses ?? []);
      setLoading(false);
    }

    loadInitialData().catch(() => {
      setMessage("Unable to load dashboard right now.");
      setLoading(false);
    });
  }, []);

  const cities = useMemo(() => {
    const citySet = new Set(dresses.map((dress) => dress.location.city));
    return Array.from(citySet).sort();
  }, [dresses]);

  const locationStats = useMemo(() => {
    return dresses.reduce<Record<string, number>>((acc, dress) => {
      acc[dress.location.city] = (acc[dress.location.city] ?? 0) + 1;
      return acc;
    }, {});
  }, [dresses]);

  const dressMarkers = useMemo(() => {
    return dresses.map((dress) => ({
      id: dress._id,
      latitude: dress.location.coordinates.latitude,
      longitude: dress.location.coordinates.longitude,
      label: dress.title,
      description: `${dress.location.city}, ${dress.location.state}`,
    }));
  }, [dresses]);

  async function handleFilter(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    await fetchDresses(search, location);
    setLoading(false);
  }

  async function handleCheckout(dress: ApiDress) {
    if (!authState.authenticated || !authState.user) {
      setMessage("Please login as a user before checkout.");
      return;
    }

    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const response = await fetchWithLoader("/api/checkout/phonepe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dressId: dress._id,
        rentalStart: today.toISOString(),
        rentalEnd: tomorrow.toISOString(),
        deliveryLocation: `${dress.location.landmark}, ${dress.location.city}`,
        mode: checkoutMode,
      }),
    });

    const data = (await response.json()) as CheckoutResponse;
    setMessage(data.message ?? "Checkout attempted.");

    if (!response.ok) {
      return;
    }

    if (data.mode === "real") {
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      }
      if (data.merchantTransactionId) {
        setPendingTransactionId(data.merchantTransactionId);
      }
    }

    setLoading(true);
    await fetchDresses(search, location);
    setLoading(false);
  }

  async function handleRefreshPaymentStatus() {
    if (!pendingTransactionId) {
      setMessage("No pending transaction available to verify.");
      return;
    }

    const response = await fetchWithLoader(
      `/api/checkout/phonepe/status?merchantTransactionId=${encodeURIComponent(
        pendingTransactionId,
      )}`,
      { cache: "no-store" },
    );

    const data = (await response.json()) as { message?: string; state?: string };
    setMessage(
      data.message
        ? `${data.message} ${data.state ? `(State: ${data.state})` : ""}`
        : "Status refreshed.",
    );

    if (response.ok && data.state && data.state !== "PENDING") {
      setPendingTransactionId("");
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Dress Dashboard</h1>
        <p className="text-slate-300">
          Search listings, filter by city, and visualize inventory on a live map.
        </p>
      </section>

      {!authState.authenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Login required for checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">
              You can browse dresses without login, but checkout and payment require a user
              session.
            </p>
            <Link href="/login?google=1">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-5 text-sm text-slate-300">
            Logged in as <span className="font-semibold">{authState.user?.name}</span> (
            {authState.user?.email})
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search & Location-wise Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 md:grid-cols-4" onSubmit={handleFilter}>
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-300">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, brand, description"
                  className="pl-9"
                />
              </div>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-300">City</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
              >
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Apply Filters
              </Button>
            </div>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-300">Payment flow</span>
              <select
                value={checkoutMode}
                onChange={(event) => setCheckoutMode(event.target.value as "mock" | "real")}
                className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
              >
                <option value="real">Real PhonePe signature flow</option>
                <option value="mock">Mock free test transaction</option>
              </select>
            </label>

            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleRefreshPaymentStatus}
                disabled={!pendingTransactionId}
              >
                Check Latest PhonePe Status
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(locationStats).map(([city, count]) => (
              <Badge key={city} tone="primary">
                {city}: {count} dresses
              </Badge>
            ))}
          </div>

          {message ? <p className="text-sm text-slate-200">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Location Map</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationMap markers={dressMarkers} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <LoadingScene
            compact
            title="Loading dresses"
            message="Applying filters and map markers..."
          />
          <DressGridSkeleton />
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {dresses.map((dress) => (
            <DressCard
              key={dress._id}
              dress={dress}
              onRent={handleCheckout}
              rentButtonLabel={
                checkoutMode === "real"
                  ? "Pay via PhonePe (Signed)"
                  : "Rent with Mock PhonePe"
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}
