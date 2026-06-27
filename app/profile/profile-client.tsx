"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, IndianRupee, MapPin, PackageOpen } from "lucide-react";
import { DressCard } from "@/components/dress-card";
import { LocationMap } from "@/components/location-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSkeleton } from "@/components/ui/profile-skeleton";
import { fetchWithLoader } from "@/lib/client-api";
import { ApiCollection, ApiDress, ApiOrder, ApiTransaction, ApiUser } from "@/types/api";

type ProfileResponse = {
  user: ApiUser;
  listedDresses: ApiDress[];
  activeOrders: ApiOrder[];
  transactions: ApiTransaction[];
  collections: ApiCollection[];
};

type AuthMeResponse = {
  authenticated: boolean;
  user: ApiUser | null;
};

export function ProfileClient() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function initializeProfile() {
      const authResponse = await fetchWithLoader("/api/auth/me", { cache: "no-store" });
      const authData = (await authResponse.json()) as AuthMeResponse;

      if (!authData.authenticated) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      const profileResponse = await fetchWithLoader("/api/profile/me", { cache: "no-store" });
      if (!profileResponse.ok) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileData = (await profileResponse.json()) as ProfileResponse;
      setProfile(profileData);
      setLoading(false);
    }

    initializeProfile().catch(() => setLoading(false));
  }, []);

  const totalSpent = useMemo(() => {
    return profile?.transactions.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  }, [profile]);

  const activeOrderMarkers = useMemo(() => {
    return (
      profile?.activeOrders.map((order) => ({
        id: order._id,
        latitude: order.trackingLocation.latitude,
        longitude: order.trackingLocation.longitude,
        label: order.dress.title,
        description: `Tracking in ${order.trackingCity}`,
      })) ?? []
    );
  }, [profile?.activeOrders]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">
            Please login to view your personal profile, rentals, and transactions.
          </p>
          <Link href="/login?google=1">
            <Button>Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return <p className="text-sm text-slate-300">Unable to load profile right now.</p>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Profile View</h1>
        <p className="text-slate-300">
          Track your listed dresses, active rental orders, and transaction history.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageOpen className="h-4 w-4 text-cyan-300" />
              Listed Dresses
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-fuchsia-200">
            {profile.listedDresses.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-cyan-300" />
              Active Rentals
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-fuchsia-200">
            {profile.activeOrders.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4 text-cyan-300" />
              Transaction Total
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-fuchsia-200">
            ₹{totalSpent.toLocaleString()}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Live Active Order Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationMap markers={activeOrderMarkers} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Listed Dresses</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {profile.listedDresses.map((dress) => (
            <DressCard key={dress._id} dress={dress} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Active Orders</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {profile.activeOrders.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <CardTitle className="text-base">{order.dress.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-300" />
                  Tracking City:{" "}
                  <Badge tone="primary" className="ml-1">
                    {order.trackingCity}
                  </Badge>
                </p>
                <p>
                  Rental: {new Date(order.rentalStart).toLocaleDateString()} -{" "}
                  {new Date(order.rentalEnd).toLocaleDateString()}
                </p>
                <p>Total: ₹{order.totalAmount.toLocaleString()}</p>
                <p>Status: {order.orderStatus}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Your Collections</h2>
          <Link href="/collections">
            <Button variant="secondary">Manage Collections</Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {profile.collections.map((collection) => (
            <Card key={collection._id}>
              <CardContent className="space-y-2 pt-5">
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collection.imageUrl}
                    alt={collection.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-white">{collection.title}</h3>
                <p className="text-xs text-slate-300">
                  {collection.material} • {collection.category}
                </p>
                <p className="text-sm text-slate-300">{collection.description}</p>
              </CardContent>
            </Card>
          ))}
          {profile.collections.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm text-slate-300">
                You have not added collections yet. Create one from the Collections page.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Transaction History</h2>
        <Card>
          <CardContent className="overflow-x-auto pt-5">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-slate-300">
                  <th className="px-2 py-2 font-medium">Transaction ID</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {profile.transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-white/8">
                    <td className="px-2 py-2">{transaction.merchantTransactionId}</td>
                    <td className="px-2 py-2">
                      ₹{transaction.amount.toLocaleString()} {transaction.currency}
                    </td>
                    <td className="px-2 py-2">
                      <Badge
                        tone={
                          transaction.status === "SUCCESS"
                            ? "success"
                            : transaction.status === "FAILED"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
