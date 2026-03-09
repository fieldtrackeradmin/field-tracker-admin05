"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
});

export default function LiveMapPage() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600 }}>
        Live Employee Map
      </h2>

      <MapView />
    </div>
  );
}