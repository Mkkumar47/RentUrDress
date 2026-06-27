"use client";

import dynamic from "next/dynamic";

export type LocationMarker = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  description?: string;
};

type LocationMapProps = {
  markers: LocationMarker[];
  heightClassName?: string;
};

const DynamicLocationMapInner = dynamic(
  () => import("./location-map-inner").then((mod) => mod.LocationMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl border border-white/15 bg-slate-900/65 text-sm text-slate-300">
        Loading map...
      </div>
    ),
  },
);

export function LocationMap({ markers, heightClassName }: LocationMapProps) {
  return (
    <DynamicLocationMapInner markers={markers} heightClassName={heightClassName ?? "h-80"} />
  );
}
