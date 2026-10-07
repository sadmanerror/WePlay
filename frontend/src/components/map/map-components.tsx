'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Match, LatLng, SportId } from '@/types';
import { getSportEmoji, formatDate, formatTime, isOngoingEvent } from '@/lib/utils';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';
import 'leaflet/dist/leaflet.css';

// ---- Custom sport-colored marker icon ----
function createSportIcon(sportId: SportId): L.DivIcon {
  const colorMap: Record<SportId, string> = {
    cricket: '#10b981',
    football: '#3b82f6',
    basketball: '#f97316',
    badminton: '#8b5cf6',
  };
  const emoji = getSportEmoji(sportId);
  const color = colorMap[sportId];

  return L.divIcon({
    className: 'custom-sport-marker',
    html: `
      <div style="
        width: 40px; height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${emoji}
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${color};
        margin: -2px auto 0;
      "></div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -45],
  });
}

// ---- User location marker ----
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 16px; height: 16px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 4px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ---- Pinned event location marker ----
const pinnedLocationIcon = L.divIcon({
  className: 'pinned-location-marker',
  html: `
    <div style="
      width: 44px; height: 44px;
      background: #dc2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    ">
      📍
    </div>
    <div style="
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 10px solid #dc2626;
      margin: -2px auto 0;
    "></div>
  `,
  iconSize: [44, 54],
  iconAnchor: [22, 54],
  popupAnchor: [0, -48],
});

// ---- Recenter map component ----
function RecenterMap({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

// ---- Map click handler ----
function MapClickHandler({ onClick }: { onClick?: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ---- Main MapView component ----
interface MapViewProps {
  matches: Match[];
  userLocation: LatLng | null;
  center?: LatLng;
  zoom?: number;
  radius?: number; // km, for radius circle
  onMatchClick?: (matchId: string) => void;
  onMapClick?: (latlng: LatLng) => void;
  selectedMatchId?: string | null;
  pinnedLocation?: LatLng | null;
  isPinningMode?: boolean;
  className?: string;
  interactive?: boolean;
}

export function MapView({
  matches,
  userLocation,
  center,
  zoom = DEFAULT_ZOOM,
  radius,
  onMatchClick,
  onMapClick,
  selectedMatchId,
  pinnedLocation,
  isPinningMode = false,
  className = '',
  interactive = true,
}: MapViewProps) {
  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : DEFAULT_CENTER;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isPinningMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-red-600 text-white px-4 py-2 rounded-full shadow-lg font-medium text-xs sm:text-sm flex items-center gap-2 animate-pulse pointer-events-none">
          <span>📍</span>
          <span>Click anywhere on the map to pin event location</span>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        zoomControl={false}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={mapCenter} zoom={zoom} />
        {onMapClick && <MapClickHandler onClick={onMapClick} />}

        {/* Pinned event location marker */}
        {pinnedLocation && (
          <Marker
            position={[pinnedLocation.lat, pinnedLocation.lng]}
            icon={pinnedLocationIcon}
          >
            <Popup autoPan>
              <div className="p-1 text-center">
                <span className="font-semibold text-sm text-red-600 block">📍 Pinned Location</span>
                <span className="text-[11px] text-gray-500">
                  {pinnedLocation.lat.toFixed(4)}, {pinnedLocation.lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <span className="text-sm font-medium">You are here</span>
            </Popup>
          </Marker>
        )}

        {/* Radius circle */}
        {userLocation && radius && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radius * 1000}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.05,
              weight: 2,
              dashArray: '8, 4',
            }}
          />
        )}

        {/* Match markers */}
        {matches.map((match) => {
          const isSelected = selectedMatchId === match.id;
          const ongoing = isOngoingEvent(match);
          const isFull = match.currentPlayers >= match.maxPlayers || match.status === 'full';

          return (
            <Marker
              key={match.id}
              position={[match.location.lat, match.location.lng]}
              icon={createSportIcon(match.sportId)}
              opacity={selectedMatchId ? (isSelected ? 1.0 : 0.6) : 1.0}
            >
              <Popup>
                <div className="p-1.5 min-w-[210px] max-w-[260px]">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1 border-b">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium capitalize bg-muted px-2 py-0.5 rounded-full">
                      <span>{getSportEmoji(match.sportId)}</span>
                      <span>{match.sportId}</span>
                    </span>

                    {ongoing ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse inline-block" />
                        Ongoing
                      </span>
                    ) : isFull ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        Full
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        Open for Register
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-foreground leading-tight mb-1">
                    {match.title}
                  </h3>

                  <div className="text-xs text-muted-foreground space-y-1 mb-2">
                    <p className="flex items-center gap-1 truncate">
                      <span>📍</span>
                      <span className="font-medium text-foreground">{match.venueName}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span>📅</span>
                      <span>{formatDate(match.date)} • {formatTime(match.date)}</span>
                    </p>
                    {match.organizedBy && (
                      <p className="flex items-center gap-1 truncate text-[11px]">
                        <span>👤</span>
                        <span>By: <strong>{match.organizedBy}</strong></span>
                      </p>
                    )}
                    {match.contactDetails && (
                      <p className="flex items-center gap-1 truncate text-[11px]">
                        <span>📞</span>
                        <span>{match.contactDetails}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-primary font-medium text-[11px] pt-0.5">
                      <span>👥</span>
                      <span>{match.currentPlayers}/{match.maxPlayers} players</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onMatchClick?.(match.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs py-1.5 px-3 rounded-md transition shadow-xs text-center cursor-pointer block"
                  >
                    View / Join Event →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// ---- Mini MapView for detail pages ----
interface MiniMapProps {
  location: LatLng;
  sportId: SportId;
  venueName: string;
  className?: string;
}

export function MiniMap({ location, sportId, venueName, className = '' }: MiniMapProps) {
  return (
    <div className={`rounded-card overflow-hidden border ${className}`}>
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={15}
        className="w-full h-[200px]"
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[location.lat, location.lng]}
          icon={createSportIcon(sportId)}
        >
          <Popup>{venueName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// ---- Pin Drop Map for match creation ----
interface PinDropMapProps {
  value: LatLng | null;
  onChange: (latlng: LatLng) => void;
  className?: string;
}

export function PinDropMap({ value, onChange, className = '' }: PinDropMapProps) {
  const center: [number, number] = value
    ? [value.lat, value.lng]
    : DEFAULT_CENTER;

  const pinIcon = L.divIcon({
    className: 'pin-drop-marker',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: #10b981;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: bounce 0.5s ease;
      ">📍</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return (
    <div className={`rounded-card overflow-hidden border ${className}`}>
      <MapContainer
        center={center}
        zoom={14}
        className="w-full h-[300px]"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={onChange} />
        {value && (
          <Marker position={[value.lat, value.lng]} icon={pinIcon}>
            <Popup>Match location</Popup>
          </Marker>
        )}
      </MapContainer>
      <p className="text-xs text-muted-foreground text-center py-2">
        Click on the map to drop a pin
      </p>
    </div>
  );
}
