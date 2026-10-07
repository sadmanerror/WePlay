'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/shared/toast';
import { SportId, LatLng, Venue } from '@/types';
import * as venueService from '@/services/venues';
import { PinDropMap } from '@/components/map';
import {
  Building2, MapPin, Phone, User, DollarSign, Clock,
  ArrowLeft, Loader2, Plus,
  ShieldCheck, Sparkles, Check
} from 'lucide-react';
import { DEFAULT_CENTER } from '@/lib/constants';

interface CreateVenuePanelProps {
  onClose: () => void;
  onVenueCreated: (venue: Venue) => void;
}

const AVAILABLE_SPORTS: { id: SportId; name: string; emoji: string }[] = [
  { id: 'football', name: 'Football', emoji: '⚽' },
  { id: 'cricket', name: 'Cricket', emoji: '🏏' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀' },
];

const SURFACE_OPTIONS = [
  'Artificial AstroTurf',
  'Natural Grass Field',
  'Indoor Wooden Court',
  'Synthetic / Acrylic Court',
  'Enclosed Box Cricket Net',
];

const AMENITY_OPTIONS = [
  { id: 'floodlights', label: '💡 Night Floodlights' },
  { id: 'changing_rooms', label: '🚿 Changing Rooms & Showers' },
  { id: 'parking', label: '🅿️ Free Parking' },
  { id: 'water', label: '🥤 Clean Drinking Water' },
  { id: 'equipment', label: '🎽 Bibs & Balls Provided' },
  { id: 'ac', label: '❄️ Air Conditioned Lounge' },
  { id: 'cafe', label: '☕ Café / Snacks' },
];

export function CreateVenuePanel({ onClose, onVenueCreated }: CreateVenuePanelProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSports, setSelectedSports] = useState<SportId[]>(['football']);
  const [surfaceType, setSurfaceType] = useState('Artificial AstroTurf');
  const [hourlyRate, setHourlyRate] = useState('1800');
  const [offPeakRate, setOffPeakRate] = useState('1200');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '💡 Night Floodlights',
    '🅿️ Free Parking',
    '🥤 Clean Drinking Water',
  ]);
  const [openingHour, setOpeningHour] = useState(8);
  const [closingHour, setClosingHour] = useState(23);

  // Location pinning
  const [pinnedLocation, setPinnedLocation] = useState<LatLng | null>({
    lat: DEFAULT_CENTER[0],
    lng: DEFAULT_CENTER[1],
  });
  const [hasPinned, setHasPinned] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleSport = (sport: SportId) => {
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.length > 1
          ? prev.filter(s => s !== sport)
          : prev
        : [...prev, sport]
    );
  };

  const toggleAmenity = (label: string) => {
    setSelectedAmenities(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please provide a venue name', 'error');
      return;
    }
    if (!address.trim()) {
      showToast('Please provide the address or neighborhood', 'error');
      return;
    }
    if (!contactPhone.trim()) {
      showToast('Please provide a booking phone / WhatsApp number', 'error');
      return;
    }
    if (selectedSports.length === 0) {
      showToast('Please select at least one supported sport', 'error');
      return;
    }
    if (!hourlyRate || Number(hourlyRate) <= 0) {
      showToast('Please set a valid hourly rate', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await venueService.createVenue({
        name: name.trim(),
        address: address.trim(),
        location: pinnedLocation || { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] },
        sports: selectedSports,
        surfaceType,
        hourlyRate: Number(hourlyRate),
        offPeakRate: offPeakRate ? Number(offPeakRate) : undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactPhone: contactPhone.trim(),
        amenities: selectedAmenities,
        openingHour: Number(openingHour),
        closingHour: Number(closingHour),
      });

      showToast(`Partner Venue "${created.name}" listed successfully! 🎉`, 'success');
      onVenueCreated(created);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to list venue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-5 sm:p-7 shadow-sm space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              List a Partner Turf or Venue
            </h2>
            <p className="text-xs text-muted-foreground">
              Register your sports facility, set standard and off-peak pricing, and allow neighborhood players to discover and reserve slots.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs py-1">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Partner Registration
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Facility Basics */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
            Facility Basics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="venue-name" className="text-xs font-medium">
                Turf / Venue Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue-name"
                placeholder="e.g. Apex Arena Football Turf, Banani Indoor Badminton Club"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="venue-address" className="text-xs font-medium">
                Detailed Address / Neighborhood <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue-address"
                placeholder="e.g. Plot 14, Road 11, Block D, Banani, Dhaka"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">
                Sports Accommodated <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SPORTS.map(s => {
                  const isSelected = selectedSports.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSport(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
                      }`}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.name}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="venue-surface" className="text-xs font-medium">
                Turf / Court Surface
              </Label>
              <select
                id="venue-surface"
                value={surfaceType}
                onChange={e => setSurfaceType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              >
                {SURFACE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Time Slots */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
            Pricing & Booking Slots
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="venue-rate" className="text-xs font-medium flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Standard Hourly Rate (৳ BDT) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue-rate"
                type="number"
                min="100"
                step="50"
                placeholder="1800"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venue-offpeak" className="text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Off-Peak Discount Rate (৳ BDT) <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="venue-offpeak"
                type="number"
                min="50"
                step="50"
                placeholder="1200"
                value={offPeakRate}
                onChange={e => setOffPeakRate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Opening Time
              </Label>
              <select
                value={openingHour}
                onChange={e => setOpeningHour(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              >
                {[6, 7, 8, 9, 10].map(h => (
                  <option key={h} value={h}>
                    {h}:00 AM
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Closing Time
              </Label>
              <select
                value={closingHour}
                onChange={e => setClosingHour(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
              >
                {[20, 21, 22, 23, 24].map(h => (
                  <option key={h} value={h}>
                    {h === 24 ? '12:00 AM (Midnight)' : `${h - 12}:00 PM`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Facilities & Amenities */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
            Amenities & Facilities
          </h3>
          <p className="text-xs text-muted-foreground">Select all amenities available at this venue:</p>

          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(a => {
              const isSelected = selectedAmenities.includes(a.label);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAmenity(a.label)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Contact Information */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
            Manager & Booking Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="venue-contact-person" className="text-xs font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Contact Person / Manager Name
              </Label>
              <Input
                id="venue-contact-person"
                placeholder="e.g. Md. Tanvir Ahmed"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venue-contact-phone" className="text-xs font-medium flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Phone / WhatsApp for Bookings <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue-contact-phone"
                placeholder="+880 17XX-XXXXXX"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 5: Map Location Pinning */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
            Venue Location on Map
          </h3>
          <p className="text-xs text-muted-foreground">
            Pin the exact location of your venue so neighborhood players can view it on the interactive map.
          </p>

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium">
                  {hasPinned && pinnedLocation
                    ? `Pinned: [${pinnedLocation.lat.toFixed(4)}, ${pinnedLocation.lng.toFixed(4)}]`
                    : 'Default Dhaka Center'}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs h-8"
              >
                {showMapPicker ? 'Hide Map Picker' : hasPinned ? 'Adjust Pin on Map' : '📍 Open Map Pin Picker'}
              </Button>
            </div>

            {showMapPicker && (
              <div className="space-y-2 pt-2 border-t border-primary/10">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                  <span className="animate-pulse">📍</span>
                  Tap anywhere on the mini-map below to set your venue pin:
                </p>
                <div className="w-full">
                  <PinDropMap
                    value={pinnedLocation}
                    onChange={(latlng) => {
                      setPinnedLocation(latlng);
                      setHasPinned(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 shadow-sm flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Venue...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Register & List Venue</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
