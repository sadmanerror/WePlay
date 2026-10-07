'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chip } from '@/components/shared/chip';
import { useToast } from '@/components/shared/toast';
import { useAuthStore } from '@/stores/auth-store';
import { SPORTS } from '@/lib/constants';
import { SportId, LatLng, Match } from '@/types';
import * as matchService from '@/services/matches';
import {
  ArrowLeft, MapPin, Calendar, User, Phone,
  CheckCircle2, AlertCircle, Loader2, Plus
} from 'lucide-react';

interface CreateEventPanelProps {
  onClose: () => void;
  onEventCreated: (match: Match) => void;
  pinnedLocation: LatLng | null;
  onStartPinning: () => void;
  isPinningMode: boolean;
}

export function CreateEventPanel({
  onClose,
  onEventCreated,
  pinnedLocation,
  onStartPinning,
  isPinningMode,
}: CreateEventPanelProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [sportId, setSportId] = useState<SportId>('cricket');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    // Default to tomorrow 4:00 PM
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(16, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [organizedBy, setOrganizedBy] = useState(user?.name || '');
  const [contactDetails, setContactDetails] = useState('');
  const [venueName, setVenueName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [entryFee, setEntryFee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter an event name', 'error');
      return;
    }
    if (!venueName.trim()) {
      showToast('Please enter location details / venue name', 'error');
      return;
    }
    if (!organizedBy.trim()) {
      showToast('Please enter who is organising the event', 'error');
      return;
    }
    if (!pinnedLocation) {
      showToast('Please pin the location on the map before publishing', 'error');
      onStartPinning();
      return;
    }

    setSubmitting(true);
    try {
      const newMatch = await matchService.createMatch({
        sportId,
        title: title.trim(),
        venueName: venueName.trim(),
        location: pinnedLocation,
        date: new Date(date).toISOString(),
        durationMinutes: 90,
        maxPlayers: Number(maxPlayers) || 12,
        entryFee: entryFee ? Number(entryFee) : null,
        organizedBy: organizedBy.trim(),
        contactDetails: contactDetails.trim() || undefined,
        description: `Organized by ${organizedBy.trim()}.${contactDetails ? ` Contact: ${contactDetails.trim()}` : ''}`,
      });

      showToast('Event created successfully!', 'success');
      onEventCreated(newMatch);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Matches</span>
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          New Event
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* Sport selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Select Sport</Label>
          <div className="flex flex-wrap gap-1.5">
            {SPORTS.map((s) => (
              <Chip
                key={s.id}
                label={`${s.emoji} ${s.name}`}
                selected={sportId === s.id}
                onClick={() => setSportId(s.id as SportId)}
                color={s.color}
              />
            ))}
          </div>
        </div>

        {/* Event Name */}
        <div className="space-y-1">
          <Label htmlFor="event-name" className="text-xs font-semibold">
            Event Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="event-name"
            placeholder="e.g. Sunday Gully Cricket, Evening 7v7 Football"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
            required
          />
        </div>

        {/* Date & Time */}
        <div className="space-y-1">
          <Label htmlFor="event-date" className="text-xs font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            Date & Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="event-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm"
            required
          />
        </div>

        {/* Organised by */}
        <div className="space-y-1">
          <Label htmlFor="event-org" className="text-xs font-semibold flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            Organised by <span className="text-destructive">*</span>
          </Label>
          <Input
            id="event-org"
            placeholder="Your name or organization"
            value={organizedBy}
            onChange={(e) => setOrganizedBy(e.target.value)}
            className="text-sm"
            required
          />
        </div>

        {/* Contact Details */}
        <div className="space-y-1">
          <Label htmlFor="event-contact" className="text-xs font-semibold flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            Contact Details <span className="text-muted-foreground font-normal">(Phone / WhatsApp)</span>
          </Label>
          <Input
            id="event-contact"
            placeholder="+880 17XX-XXXXXX"
            value={contactDetails}
            onChange={(e) => setContactDetails(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Location Details */}
        <div className="space-y-1">
          <Label htmlFor="event-venue" className="text-xs font-semibold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            Location Details <span className="text-destructive">*</span>
          </Label>
          <Input
            id="event-venue"
            placeholder="e.g. Banani DOHS Ground, Road 11 Field"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            className="text-sm"
            required
          />
        </div>

        {/* Max Players & Entry Fee */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="event-players" className="text-xs font-semibold">
              Max Players
            </Label>
            <Input
              id="event-players"
              type="number"
              min="2"
              max="50"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-fee" className="text-xs font-semibold">
              Fee (৳ BDT) <span className="text-muted-foreground font-normal">(0 = Free)</span>
            </Label>
            <Input
              id="event-fee"
              type="number"
              min="0"
              placeholder="0"
              value={entryFee}
              onChange={(e) => setEntryFee(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Map Pinning Section */}
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Pin Location on Map</span>
              <span className="text-destructive">*</span>
            </div>
            {pinnedLocation ? (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pinned
              </span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Required
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {pinnedLocation
              ? `Pinned coordinates: [${pinnedLocation.lat.toFixed(4)}, ${pinnedLocation.lng.toFixed(4)}]. Tap map to move pin.`
              : 'Tap "Pin on Map", then click anywhere on the open map to set your event location.'}
          </p>

          <Button
            type="button"
            onClick={onStartPinning}
            variant={isPinningMode ? 'default' : pinnedLocation ? 'outline' : 'default'}
            className={
              isPinningMode
                ? 'w-full bg-red-600 hover:bg-red-700 text-white text-xs animate-pulse'
                : pinnedLocation
                ? 'w-full text-xs border-primary/40 text-primary hover:bg-primary/10'
                : 'w-full bg-primary hover:bg-primary/90 text-white text-xs'
            }
          >
            {isPinningMode ? (
              <>📍 Click anywhere on the map now...</>
            ) : pinnedLocation ? (
              <>📍 Change Pinned Location on Map</>
            ) : (
              <>📍 Pin the Location in the Map</>
            )}
          </Button>
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 text-xs"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Publishing...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Publish Event
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

