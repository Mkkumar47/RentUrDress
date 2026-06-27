"use client";

import { Icon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { LocationMarker } from "./location-map";

type LocationMapInnerProps = {
  markers: LocationMarker[];
  heightClassName: string;
};

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function getCenter(markers: LocationMarker[]) {
  if (markers.length === 0) {
    return { latitude: 20.5937, longitude: 78.9629 };
  }

  const sum = markers.reduce(
    (acc, marker) => ({
      latitude: acc.latitude + marker.latitude,
      longitude: acc.longitude + marker.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: sum.latitude / markers.length,
    longitude: sum.longitude / markers.length,
  };
}

export function LocationMapInner({ markers, heightClassName }: LocationMapInnerProps) {
  if (markers.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-white/15 bg-slate-900/65 text-sm text-slate-300">
        No location points available.
      </div>
    );
  }

  const center = getCenter(markers);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={5}
      scrollWheelZoom
      className={`${heightClassName} w-full rounded-xl border border-white/15`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={markerIcon}
        >
          <Popup>
            <p className="font-semibold">{marker.label}</p>
            {marker.description ? <p>{marker.description}</p> : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
