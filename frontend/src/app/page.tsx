'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapView } from '@/components/map';
import { FilterBar } from '@/components/layout/filter-bar';
import { MatchList, CreateEventPanel } from '@/components/match';
import { SkeletonMap } from '@/components/shared/skeleton-map';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useFilterStore } from '@/stores/filter-store';
import { Match, LatLng } from '@/types';
import * as matchService from '@/services/matches';
import { isFinishedEvent } from '@/lib/utils';
import { List, MapIcon, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const { position, loading: geoLoading } = useGeolocation();
  const filters = useFilterStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // Event creation & map pinning state
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<LatLng | null>(null);
  const [isPinningMode, setIsPinningMode] = useState(false);

  // Update center when geolocation resolves
  useEffect(() => {
    if (position) {
      filters.setCenter(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await matchService.getMatches({
        sports: filters.sports,
        radius: filters.radius,
        date: filters.date,
        center: filters.center,
        status: ['open', 'full', 'in_progress'],
      });
      // Erase finished events
      setMatches(data.filter(m => !isFinishedEvent(m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [filters.sports, filters.radius, filters.date, filters.center]);

  // Fetch matches when filters change
  useEffect(() => {
    let ignore = false;
    matchService.getMatches({
      sports: filters.sports,
      radius: filters.radius,
      date: filters.date,
      center: filters.center,
      status: ['open', 'full', 'in_progress'],
    }).then(data => {
      if (!ignore) {
        setMatches(data.filter(m => !isFinishedEvent(m)));
        setError(null);
        setLoading(false);
      }
    }).catch(err => {
      if (!ignore) {
        setError(err instanceof Error ? err.message : 'Failed to load matches');
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [filters.sports, filters.radius, filters.date, filters.center]);

  const handleMatchClick = useCallback(
    (matchId: string) => {
      router.push(`/matches/${matchId}`);
    },
    [router]
  );

  const handleMapClick = useCallback((latlng: LatLng) => {
    if (isPinningMode || isCreatingEvent) {
      setPinnedLocation(latlng);
      setIsPinningMode(false);
      if (mobileView === 'map' && isCreatingEvent) {
        setMobileView('list');
      }
    }
  }, [isPinningMode, isCreatingEvent, mobileView]);

  const handleEventCreated = (newMatch: Match) => {
    setIsCreatingEvent(false);
    setIsPinningMode(false);
    setPinnedLocation(null);
    filters.setCenter(newMatch.location);
    fetchMatches();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[420px] border-r bg-background">
        {!isCreatingEvent && (
          <div className="p-4 border-b">
            <FilterBar />
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {isCreatingEvent ? (
            <CreateEventPanel
              onClose={() => {
                setIsCreatingEvent(false);
                setIsPinningMode(false);
              }}
              onEventCreated={handleEventCreated}
              pinnedLocation={pinnedLocation}
              onStartPinning={() => setIsPinningMode(true)}
              isPinningMode={isPinningMode}
            />
          ) : (
            <>
              {/* Prominent Create Event Action */}
              <div className="mb-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Host Your Game</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Interactive map pin</span>
                </div>
                <Button
                  onClick={() => {
                    setIsCreatingEvent(true);
                    setPinnedLocation(null);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-9 shadow-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </div>

              {/* Event Listings Directly Under Create Event */}
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    All Active Events
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Open for registration, ongoing & full
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-foreground">
                    {loading ? '...' : `${matches.length} active`}
                  </span>
                  <Button variant="ghost" size="sm" onClick={fetchMatches} className="text-xs h-7 px-2">
                    Refresh
                  </Button>
                </div>
              </div>

              <MatchList
                matches={matches}
                loading={loading}
                onMatchClick={handleMatchClick}
                onCreateEvent={() => {
                  setIsCreatingEvent(true);
                  setPinnedLocation(null);
                }}
              />
              {error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                  <button onClick={fetchMatches} className="underline ml-2">
                    Retry
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Map area */}
      <div className="flex-1 relative">
        {/* Mobile filter bar */}
        {!isCreatingEvent && (
          <div className="lg:hidden absolute top-0 left-0 right-0 z-10 p-3">
            <FilterBar />
          </div>
        )}

        {/* Mobile toggle button */}
        <div className="lg:hidden absolute bottom-20 right-4 z-10">
          <Button
            onClick={() => setMobileView(mobileView === 'map' ? 'list' : 'map')}
            className="rounded-full shadow-lg w-12 h-12"
            size="icon"
          >
            {mobileView === 'map' ? <List className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile list view */}
        {mobileView === 'list' && (
          <div className="lg:hidden absolute inset-0 z-[5] bg-background overflow-y-auto pt-20 px-4 pb-4">
            {isCreatingEvent ? (
              <CreateEventPanel
                onClose={() => {
                  setIsCreatingEvent(false);
                  setIsPinningMode(false);
                }}
                onEventCreated={handleEventCreated}
                pinnedLocation={pinnedLocation}
                onStartPinning={() => {
                  setIsPinningMode(true);
                  setMobileView('map');
                }}
                isPinningMode={isPinningMode}
              />
            ) : (
              <>
                {/* Mobile Create Event Option */}
                <div className="mb-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <Button
                    onClick={() => {
                      setIsCreatingEvent(true);
                      setPinnedLocation(null);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-9 shadow-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Event
                  </Button>
                </div>

                {/* Mobile Event Listing Under Create Event */}
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      All Active Events
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Open for registration, ongoing & full
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-foreground">
                    {loading ? '...' : `${matches.length} active`}
                  </span>
                </div>
                <MatchList
                  matches={matches}
                  loading={loading}
                  onMatchClick={handleMatchClick}
                  onCreateEvent={() => {
                    setIsCreatingEvent(true);
                    setPinnedLocation(null);
                  }}
                />
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {error}
                    <button onClick={fetchMatches} className="underline ml-2">
                      Retry
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Map */}
        <div className={`w-full h-full ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
          {geoLoading ? (
            <SkeletonMap />
          ) : (
            <MapView
              matches={matches}
              userLocation={position}
              center={filters.center}
              radius={filters.radius}
              onMatchClick={handleMatchClick}
              onMapClick={handleMapClick}
              pinnedLocation={pinnedLocation}
              isPinningMode={isPinningMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
