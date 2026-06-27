"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ApiDress } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { LoadingScene } from "./ui/loading-scene";
import { fetchWithLoader } from "@/lib/client-api";

export function LandingFeatured() {
  const [featuredDresses, setFeaturedDresses] = useState<ApiDress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDresses() {
      const response = await fetchWithLoader("/api/dresses?featured=true", {
        cache: "no-store",
      });
      const data = (await response.json()) as { dresses: ApiDress[] };
      setFeaturedDresses(data.dresses ?? []);
      setLoading(false);
    }

    loadDresses().catch(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="featured-dresses-heading">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-fuchsia-300" />
        <h2 id="featured-dresses-heading" className="text-2xl font-semibold text-white">
          Featured Dresses
        </h2>
      </div>

      {loading ? (
        <LoadingScene
          compact
          title="Loading featured couture"
          message="Curating premium picks..."
        />
      ) : (
        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          aria-label="Featured dresses carousel"
        >
          {featuredDresses.map((dress) => (
            <motion.div
              key={dress._id}
              className="w-[320px] shrink-0 snap-start"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <div
                  className="h-56 bg-cover bg-center"
                  style={{ backgroundImage: `url(${dress.imageUrl})` }}
                  aria-hidden
                />
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{dress.title}</CardTitle>
                    <Badge tone="primary">₹{dress.dailyRent}/day</Badge>
                  </div>
                  <CardDescription>
                    {dress.location.city}, {dress.location.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-slate-300">
                    {dress.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
