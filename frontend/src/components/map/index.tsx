'use client';

import dynamic from 'next/dynamic';

// Dynamic imports for Leaflet components (no SSR)
export const MapView = dynamic(
  () => import('./map-components').then(mod => mod.MapView),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading map...</p>
      </div>
    ),
  }
);

export const MiniMap = dynamic(
  () => import('./map-components').then(mod => mod.MiniMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[200px] bg-muted animate-pulse rounded-card" />
    ),
  }
);

export const PinDropMap = dynamic(
  () => import('./map-components').then(mod => mod.PinDropMap),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-muted animate-pulse rounded-card" />
    ),
  }
);
