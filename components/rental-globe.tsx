"use client";

import type { COBEOptions } from "cobe";
import { Globe } from "@/components/ui/globe";

const RENTAL_GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0.1,
  theta: 0.35,
  dark: 1,
  diffuse: 1.1,
  mapSamples: 20000,
  mapBrightness: 1.1,
  baseColor: [0.16, 0.14, 0.35],
  markerColor: [0.94, 0.37, 0.76],
  glowColor: [0.16, 0.83, 0.95],
  markers: [
    { location: [17.385, 78.4867], size: 0.12 }, // Hyderabad
    { location: [12.9716, 77.5946], size: 0.1 }, // Bengaluru
    { location: [13.0827, 80.2707], size: 0.09 }, // Chennai
    { location: [19.076, 72.8777], size: 0.1 }, // Mumbai
    { location: [18.5204, 73.8567], size: 0.09 }, // Pune
    { location: [28.6139, 77.209], size: 0.08 }, // Delhi
    { location: [22.5726, 88.3639], size: 0.07 }, // Kolkata
    { location: [23.0225, 72.5714], size: 0.07 }, // Ahmedabad
  ],
};

export function RentalGlobe() {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-white/12 bg-slate-950/70">
      <Globe className="top-8" config={RENTAL_GLOBE_CONFIG} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.72)_100%)]" />
    </div>
  );
}
