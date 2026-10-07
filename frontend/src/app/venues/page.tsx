'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/shared/toast';
import { Venue, VenueSlot } from '@/types';
import * as venueService from '@/services/venues';
import { getSportEmoji, formatTime, cn } from '@/lib/utils';
import { CreateVenuePanel } from '@/components/venue/create-venue-panel';
import {
  MapPin, Star, ShieldCheck, Tag, Clock,
  Loader2, Sparkles, Building2, Plus, Phone, User
} from 'lucide-react';

const SPORTS_FILTER: { id: string; label: string; emoji: string }[] = [
  { id: 'all', label: 'All Venues', emoji: '🏟️' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
];

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedSlot, setSelectedSlot] = useState<{ venue: Venue; slot: VenueSlot } | null>(null);
  const [reserving, setReserving] = useState(false);
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let ignore = false;
    venueService.getVenues(selectedSport === 'all' ? undefined : selectedSport)
      .then(data => {
        if (!ignore) {
          setVenues(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          showToast('Failed to load venues', 'error');
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedSport, showToast]);

  const refreshVenues = async () => {
    setLoading(true);
    try {
      const data = await venueService.getVenues(selectedSport === 'all' ? undefined : selectedSport);
      setVenues(data);
    } catch {
      showToast('Failed to load venues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!selectedSlot) return;
    setReserving(true);
    try {
      await venueService.reserveVenueSlot(selectedSlot.venue.id, selectedSlot.slot.id);
      showToast(`Reserved ${selectedSlot.venue.name} for ${formatTime(selectedSlot.slot.startTime)}! 🎉`, 'success');
      
      // Update local slots
      setVenues(prev => prev.map(v => {
        if (v.id === selectedSlot.venue.id) {
          return {
            ...v,
            slots: (v.slots || []).map(s => s.id === selectedSlot.slot.id ? { ...s, isBooked: true } : s),
          };
        }
        return v;
      }));
      setSelectedSlot(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Reservation failed', 'error');
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Partner Venues & Turfs</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Discover verified neighborhood pitches, indoor courts, and book available slots.
          </p>
        </div>

        {!isCreatingVenue && (
          <Button
            onClick={() => setIsCreatingVenue(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>List a Venue</span>
          </Button>
        )}
      </div>

      {/* Creation Mode or Main Listing */}
      {isCreatingVenue ? (
        <CreateVenuePanel
          onClose={() => setIsCreatingVenue(false)}
          onVenueCreated={() => {
            setIsCreatingVenue(false);
            refreshVenues();
          }}
        />
      ) : (
        <>
          {/* Sport Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {SPORTS_FILTER.map(s => {
              const isSelected = selectedSport === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSport(s.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted/50'
                  )}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Venues Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
              <p className="text-sm">Finding partner venues...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-16 p-6 border-2 border-dashed rounded-2xl bg-card/60 max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 text-foreground">No Partner Venues Listed Yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you a turf owner or facility manager? List your artificial turf, indoor court, or ground to connect with neighborhood players and accept slot reservations.
                </p>
              </div>
              <Button
                onClick={() => setIsCreatingVenue(true)}
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-5 shadow-sm text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                List Your Partner Venue
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {venues.map(venue => {
                const openSlots = (venue.slots || []).filter(s => !s.isBooked);
                const offPeakSlots = openSlots.filter(s => s.isOffPeak);

                return (
                  <div
                    key={venue.id}
                    className="border rounded-2xl bg-card overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="p-5 space-y-4">
                      {/* Top details */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h2 className="text-lg font-bold">{venue.name}</h2>
                            {venue.isVerified && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Verified Turf
                              </Badge>
                            )}
                            {venue.surfaceType && (
                              <Badge variant="secondary" className="text-[11px] font-normal">
                                {venue.surfaceType}
                              </Badge>
                            )}
                            {offPeakSlots.length > 0 && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[11px]">
                                <Tag className="w-3 h-3 mr-1" />
                                Off-Peak Deals
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{venue.address}</span>
                          </div>

                          {(venue.contactPerson || venue.contactPhone) && (
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                              {venue.contactPerson && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  <span>Manager: <strong className="text-foreground">{venue.contactPerson}</strong></span>
                                </span>
                              )}
                              {venue.contactPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-primary" />
                                  <span>Phone: <a href={`tel:${venue.contactPhone}`} className="text-primary font-medium hover:underline">{venue.contactPhone}</a></span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-semibold">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{venue.rating.toFixed(1)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground block">Standard Rate</span>
                            <span className="text-sm font-bold text-foreground">৳{venue.hourlyRate}/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Sports & Amenities */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {venue.sports.map(s => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize"
                          >
                            {getSportEmoji(s)} {s}
                          </span>
                        ))}
                        {venue.amenities && venue.amenities.map(a => (
                          <span
                            key={a}
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/5 text-primary border border-primary/10"
                          >
                            {a}
                          </span>
                        ))}
                      </div>

                      {/* Available Booking Slots */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            Open & Off-Peak Slots ({openSlots.length} available)
                          </span>
                          <span className="text-[11px] text-muted-foreground">In-App Reservation</span>
                        </div>

                        {venue.slots && venue.slots.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {venue.slots.map(slot => (
                              <div
                                key={slot.id}
                                className={cn(
                                  'p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all',
                                  slot.isBooked
                                    ? 'bg-muted/40 opacity-60 border-dashed'
                                    : slot.isOffPeak
                                    ? 'bg-amber-500/5 border-amber-500/30'
                                    : 'bg-card border-border hover:border-primary/50'
                                )}
                              >
                                <div>
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-foreground">
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </span>
                                    {slot.isOffPeak && (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/15 px-1.5 py-0.5 rounded">
                                        Off-Peak
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-bold text-foreground">
                                    ৳{slot.price}
                                  </span>
                                </div>

                                {slot.isBooked ? (
                                  <Button size="sm" variant="ghost" disabled className="h-8 text-xs w-full">
                                    Reserved
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant={slot.isOffPeak ? 'default' : 'outline'}
                                    onClick={() => setSelectedSlot({ venue, slot })}
                                    className="h-8 text-xs w-full font-medium"
                                  >
                                    Reserve Slot
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No slots currently configured.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Slot Reservation Modal */}
      {selectedSlot && (
        <Dialog open={true} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Reserve Venue Slot
              </DialogTitle>
              <DialogDescription>
                Confirm your slot reservation at {selectedSlot.venue.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 space-y-1.5">
                <p className="font-medium text-foreground">{selectedSlot.venue.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selectedSlot.venue.address}
                </p>
                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Reserved Slot:</span>
                  <span className="font-semibold">
                    {formatTime(selectedSlot.slot.startTime)} - {formatTime(selectedSlot.slot.endTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Amount to pay at ground:</span>
                  <span className="font-bold text-base text-primary">
                    ৳{selectedSlot.slot.price}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                ℹ️ <strong>In-App Reservation:</strong> Slot is held in your name without upfront payment. Pay court fees directly upon arrival at the ground.
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedSlot(null)} disabled={reserving}>
                Cancel
              </Button>
              <Button onClick={handleConfirmReservation} disabled={reserving}>
                {reserving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reserving...
                  </>
                ) : (
                  'Confirm Reservation'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
