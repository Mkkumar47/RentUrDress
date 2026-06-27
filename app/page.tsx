import Link from "next/link";
import { ArrowRight, MapPin, Wallet } from "lucide-react";
import { FashionMarquee } from "@/components/fashion-marquee";
import { LandingFeatured } from "@/components/landing-featured";
import { RentalGlobe } from "@/components/rental-globe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="glass-surface relative overflow-hidden rounded-3xl px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
            Premium Peer-to-Peer Boutique Rentals
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Rent stunning dresses nearby and earn from your own wardrobe.
          </h1>
          <p className="text-base text-slate-200 sm:text-lg">
            RentUrDress helps you browse curated fashion listings, pay with a mock
            PhonePe sandbox flow, and track your rental by city.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button className="h-10 px-5">
                Explore Dresses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="secondary" className="h-10 px-5">
                View Your Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-widest text-fuchsia-200 uppercase">
          Trending Rental Styles
        </h2>
        <FashionMarquee />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-cyan-300" />
              Location-Wise Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Filter by city to discover where dresses are available and where active
            orders are currently located.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-cyan-300" />
              Earn as a Lender
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            List your dresses, approve rentals, and track your transaction history
            from one profile dashboard.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unified Full-Stack App</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Next.js route handlers under <code>app/api</code> act as your backend
            endpoints, similar to FastAPI routes.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Global Rental Pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <RentalGlobe />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why this theme fits RentUrDress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              The new cinematic UI reflects a premium boutique mood with motion,
              depth, and polished glass surfaces.
            </p>
            <p>
              3D dress silhouettes in the background represent real wardrobe
              listings and make the app feel fashion-first.
            </p>
          </CardContent>
        </Card>
      </section>

      <LandingFeatured />
    </div>
  );
}
