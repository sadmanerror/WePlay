'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PinDropMap } from '@/components/map';
import { MatchCard } from '@/components/match/match-card';
import { useToast } from '@/components/shared/toast';
import { useAuthStore } from '@/stores/auth-store';
import { SPORTS, DEFAULT_CENTER } from '@/lib/constants';
import { SportId, LatLng, Match, CreateMatchInput } from '@/types';
import * as matchService from '@/services/matches';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Loader2
} from 'lucide-react';


function CreateMatchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(!!editId);

  // Form state
  const [sportId, setSportId] = useState<SportId>('cricket');
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [location, setLocation] = useState<LatLng>({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [entryFee, setEntryFee] = useState<string>('');
  const [minReliability, setMinReliability] = useState<number>(0);
  const [isTournament, setIsTournament] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [description, setDescription] = useState('');

  // Load existing match if edit mode
  useEffect(() => {
    if (editId) {
      matchService.getMatchById(editId)
        .then(m => {
          setSportId(m.sportId);
          setTitle(m.title);
          setVenueName(m.venueName);
          setLocation(m.location);
          setDate(new Date(m.date).toISOString().slice(0, 16));
          setDurationMinutes(m.durationMinutes);
          setMaxPlayers(m.maxPlayers);
          setEntryFee(m.entryFee ? String(m.entryFee) : '');
          if (m.minReliability !== undefined) setMinReliability(m.minReliability);
          if (m.isTournament !== undefined) setIsTournament(m.isTournament);
          if (m.tournamentName) setTournamentName(m.tournamentName);
          setDescription(m.description);
        })


        .catch(() => {
          showToast('Failed to load match to edit', 'error');
          router.push('/');
        })
        .finally(() => setFetchingExisting(false));
    }
  }, [editId, router, showToast]);

  const previewMatch: Match = {
    id: editId || 'preview-id',
    hostId: user?.id || 'u1',
    host: user || {
      id: 'u1',
      name: 'Organizer',
      email: 'host@weplay.local',
      avatarUrl: null,
      preferredSports: [sportId],
      reliabilityScore: 98,
      matchesPlayed: 12,
      matchesHosted: 5,
      joinedAt: new Date().toISOString(),
      bio: '',
    },
    sportId,
    title: title.trim() || 'Untitled Neighborhood Match',
    venueName: venueName.trim() || 'Select Venue on Map',
    location,
    date: new Date(date).toISOString(),
    durationMinutes: Number(durationMinutes) || 60,
    maxPlayers: Number(maxPlayers) || 10,
    currentPlayers: 1,
    maxSpectators: null,
    currentSpectators: 0,
    entryFee: entryFee ? Number(entryFee) : null,
    minReliability: Number(minReliability) || 0,
    isTournament,
    tournamentName: isTournament ? tournamentName.trim() : null,
    description: description.trim() || 'Pickup match hosted on WePlay. Come join us!',
    status: 'open',
    createdAt: new Date().toISOString(),
    participants: user ? [{
      id: 'p-host',
      userId: user.id,
      user,
      matchId: editId || 'preview-id',
      role: 'player',
      status: 'confirmed',
      joinedAt: new Date().toISOString(),
    }] : [],
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        showToast('Please enter a match title', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!venueName.trim()) {
        showToast('Please enter a venue or ground name', 'error');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in to host a match', 'error');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await matchService.updateMatch(editId, {
          title,
          venueName,
          location,
          date: new Date(date).toISOString(),
          durationMinutes: Number(durationMinutes),
          maxPlayers: Number(maxPlayers),
          entryFee: entryFee ? Number(entryFee) : null,
          minReliability: Number(minReliability) || 0,
          isTournament,
          tournamentName: isTournament ? tournamentName.trim() : null,
          description,
        });
        showToast('Match updated successfully! ✨', 'success');
        router.push(`/matches/${editId}`);
      } else {
        const input: CreateMatchInput = {
          sportId,
          title,
          venueName,
          location,
          date: new Date(date).toISOString(),
          durationMinutes: Number(durationMinutes),
          maxPlayers: Number(maxPlayers),
          entryFee: entryFee ? Number(entryFee) : null,
          minReliability: Number(minReliability) || 0,
          isTournament,
          tournamentName: isTournament ? tournamentName.trim() : null,
          description,
        };
        const created = await matchService.createMatch(input);
        showToast('Match hosted successfully! 🎉', 'success');
        router.push(`/matches/${created.id}`);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error saving match', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingExisting) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-muted-foreground">Loading match details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <button
          onClick={() => (step > 1 ? setStep(prev => (prev === 3 ? 2 : 1)) : router.back())}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >

          <ArrowLeft className="w-4 h-4" />
          {step > 1 ? 'Previous Step' : 'Back'}
        </button>
        <h1 className="text-lg font-bold">
          {editId ? 'Edit Match' : 'Host a Match'}
        </h1>
        <Badge variant="outline" className="font-mono text-xs">
          Step {step} of 3
        </Badge>
      </div>

      {/* Stepper Progress bar */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 1 ? 'bg-primary' : 'bg-muted'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 2 ? 'bg-primary' : 'bg-muted'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step >= 3 ? 'bg-primary' : 'bg-muted'
          }`}
        />
      </div>

      {/* Step 1: Sport & Basics */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Choose Sport</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SPORTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSportId(s.id)}
                  className={`p-3 rounded-card border text-left transition-all flex flex-col gap-1 ${
                    sportId === s.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="font-semibold text-sm">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="match-title" className="text-sm font-semibold">Match Title</Label>
            <Input
              id="match-title"
              placeholder="e.g. Sunday Morning Gully Cricket — Need 3!"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              A catchy name letting neighbors know format and how many players you need.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Description & Rules</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Bring tape ball / tennis ball? Bibs provided? What skill level is preferred?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tournament-toggle" className="text-sm font-semibold cursor-pointer">
                  🏆 Verified Community Tournament
                </Label>
                <p className="text-xs text-muted-foreground">
                  Feature this match on tournament leaderboards and neighborhood brackets.
                </p>
              </div>
              <input
                id="tournament-toggle"
                type="checkbox"
                checked={isTournament}
                onChange={e => setIsTournament(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
              />
            </div>
            {isTournament && (
              <div className="pt-2 border-t">
                <Label htmlFor="tournament-name" className="text-xs font-semibold">Tournament / Cup Name</Label>
                <Input
                  id="tournament-name"
                  placeholder="e.g. Dhaka Premier Cup 2026"
                  value={tournamentName}
                  onChange={e => setTournamentName(e.target.value)}
                  className="h-10 mt-1 bg-background text-sm"
                />
              </div>
            )}
          </div>


          <div className="pt-4 flex justify-end">
            <Button onClick={handleNext} className="gap-2">
              Next: Location & Time
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Location, Time & Slots */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="venue" className="text-sm font-semibold">Venue or Ground Name</Label>
            <Input
              id="venue"
              placeholder="e.g. Gulshan Youth Club Ground / Banani Field"
              value={venueName}
              onChange={e => setVenueName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Drop Precise GPS Pin</Label>
              <span className="text-xs text-muted-foreground font-mono">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            </div>
            <PinDropMap value={location} onChange={setLocation} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match-date" className="text-sm font-semibold">Match Date & Time</Label>
              <Input
                id="match-date"
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-semibold">Duration (Minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={30}
                max={360}
                step={15}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slots" className="text-sm font-semibold">Total Players Limit</Label>
              <Input
                id="slots"
                type="number"
                min={2}
                max={30}
                value={maxPlayers}
                onChange={e => setMaxPlayers(Number(e.target.value))}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Includes you as host.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee" className="text-sm font-semibold">Entry Fee / Court Share (BDT)</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                placeholder="0 (Free)"
                value={entryFee}
                onChange={e => setEntryFee(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Leave empty if it is free.</p>
            </div>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl border bg-muted/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="karma" className="text-sm font-semibold">Host Minimum Karma Filter</Label>
              <span className="text-xs font-semibold text-primary">
                {minReliability === 0 ? 'No requirement (0%)' : `Requires ${minReliability}%+ Karma`}
              </span>
            </div>
            <Input
              id="karma"
              type="number"
              min={0}
              max={100}
              step={5}
              placeholder="0 (Anyone can join)"
              value={minReliability}
              onChange={e => setMinReliability(Number(e.target.value))}
              className="h-11 bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Prevent no-shows and dropouts. Players with karma lower than this threshold cannot RSVP as active players (they can still cheer as spectators).
            </p>
          </div>


          <div className="pt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleNext} className="gap-2">
              Next: Live Preview
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Live Preview & Publish */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="p-4 bg-muted/40 rounded-card border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold">Live Match Card Preview</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              This is exactly how players will see your match in the nearby feed and map popups.
            </p>
            <MatchCard match={previewMatch} />
          </div>

          <div className="p-4 rounded-card border bg-card space-y-3">
            <h3 className="text-sm font-semibold">Host Summary</h3>
            <div className="text-sm space-y-1.5 text-muted-foreground">
              <p><strong className="text-foreground">Venue:</strong> {venueName}</p>
              <p><strong className="text-foreground">When:</strong> {new Date(date).toLocaleString()}</p>
              <p><strong className="text-foreground">Player Cap:</strong> {maxPlayers} players ({maxPlayers - 1} slots open)</p>
              <p><strong className="text-foreground">Fee:</strong> {entryFee ? `৳${entryFee} per player` : 'Free'}</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editId ? 'Save Changes' : 'Publish Match'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateMatchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading match builder...</div>}>
      <CreateMatchForm />
    </Suspense>
  );
}
