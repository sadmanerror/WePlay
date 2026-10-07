'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { MiniMap } from '@/components/map';
import { SlotsProgress } from '@/components/match/slots-progress';
import { PlayerAvatarRow } from '@/components/match/player-avatar-row';
import { ReliabilityBadge } from '@/components/profile/reliability-badge';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { useToast } from '@/components/shared/toast';
import { useAuthStore } from '@/stores/auth-store';
import { useMatchWebSocket } from '@/hooks/use-match-websocket';
import { Match, ParticipantRole, MatchStatus } from '@/types';
import { getSportEmoji, formatDate, formatTime, cn } from '@/lib/utils';
import * as matchService from '@/services/matches';
import { MatchLobbyChat } from '@/components/match/match-lobby-chat';
import { AttendanceModal } from '@/components/match/attendance-modal';
import {
  MapPin, Clock, Users, CalendarDays,
  DollarSign, ArrowLeft, UserPlus, UserMinus, Loader2,
  Share2, AlertTriangle, Crown, Edit, XCircle,
  Eye, Award, ShieldCheck, CheckCircle2, Phone,
} from 'lucide-react';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<'player' | 'spectator' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Username join modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinRole, setJoinRole] = useState<ParticipantRole>('player');
  const [joinUsername, setJoinUsername] = useState(user?.name || '');

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const data = await matchService.getMatchById(matchId);
        setMatch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Match not found');
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [matchId]);

  // Live WebSocket slot count updates
  useMatchWebSocket(matchId, {
    onSlotUpdate: (update) => {
      setMatch(prev => prev ? {
        ...prev,
        currentPlayers: update.currentPlayers,
        maxPlayers: update.maxPlayers,
        status: update.status as MatchStatus,
      } : null);
    },
  });

  // Comprehensive Host detection
  const isHost = Boolean(user && match && (
    match.hostId === user.id ||
    (match.host && match.host.id === user.id) ||
    (match.host && user.email && match.host.email.toLowerCase() === user.email.toLowerCase()) ||
    (match.organizedBy && user.name && match.organizedBy.trim().toLowerCase() === user.name.trim().toLowerCase())
  ));

  // Comprehensive participant detection (by id, email, or exact username)
  const currentParticipant = match?.participants?.find(p => {
    if (!user) return false;
    if (p.status !== 'confirmed') return false;
    if (p.userId === user.id) return true;
    if (user.email && p.user?.email && p.user.email.toLowerCase() === user.email.toLowerCase()) return true;
    if (user.name && p.user?.name && p.user.name.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
    return false;
  });

  const isPlayer = currentParticipant?.role === 'player';
  const isFull = match ? match.currentPlayers >= match.maxPlayers : false;
  const slotsLeft = match ? Math.max(0, match.maxPlayers - match.currentPlayers) : 0;
  const players = match?.participants?.filter(p => p.role === 'player' && p.status === 'confirmed') || [];
  const spectators = match?.participants?.filter(p => p.role === 'spectator' && p.status === 'confirmed') || [];

  // Match ended check
  const isEnded = match ? Boolean(match.isEnded || match.status === 'completed') : false;

  const openJoinModal = (role: ParticipantRole = 'player') => {
    if (currentParticipant) {
      showToast('You are already registered in this match!', 'info');
      return;
    }
    setJoinRole(role);
    setJoinUsername(user?.name || '');
    setJoinModalOpen(true);
  };

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = joinUsername.trim();
    if (!finalUsername) {
      showToast('Please enter your username', 'error');
      return;
    }

    if (!match) return;

    // Strict frontend validation: Cannot register twice
    const alreadyConfirmed = match.participants?.some(
      p => p.status === 'confirmed' && (
        (user && p.userId === user.id) ||
        p.user?.name.trim().toLowerCase() === finalUsername.toLowerCase()
      )
    );
    if (alreadyConfirmed) {
      showToast(`"${finalUsername}" is already registered in this match!`, 'error');
      return;
    }

    if (joinRole === 'player' && match.minReliability && match.minReliability > 0 && user) {
      if ((user.reliabilityScore ?? 100) < match.minReliability) {
        showToast(
          `This match requires ${match.minReliability}%+ karma. Your score is ${user.reliabilityScore}%. You can still join as a cheerer/spectator!`,
          'error'
        );
        return;
      }
    }

    setJoining(joinRole);
    try {
      const activeUserId = user?.id || `u-${finalUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const updated = await matchService.joinMatch(matchId, activeUserId, joinRole, finalUsername);
      setMatch(updated);
      setJoinModalOpen(false);

      // Save identity to auth store so returning to the page immediately recognizes them!
      const joinedP = updated.participants?.find(
        p => p.user?.name.trim().toLowerCase() === finalUsername.toLowerCase()
      );
      if (joinedP?.user) {
        useAuthStore.setState({
          user: joinedP.user,
          token: `mock-jwt-token-${joinedP.user.id}`,
          isAuthenticated: true,
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('weplay_token', `mock-jwt-token-${joinedP.user.id}`);
        }
      }

      showToast(
        joinRole === 'player' ? `Joined as ${finalUsername}! 🎉` : `Joined as cheerer: ${finalUsername}! 📣`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to join', 'error');
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async () => {
    const activeUserId = currentParticipant?.userId || user?.id;
    if (!activeUserId) return;
    setLeaving(true);
    try {
      const updated = await matchService.leaveMatch(matchId, activeUserId);
      setMatch(updated);
      showToast('You left the match', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to leave', 'error');
    } finally {
      setLeaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await matchService.cancelMatch(matchId);
      setMatch(updated);
      showToast('Match cancelled', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel', 'error');
    }
  };

  // Dynamic cost splitting
  const perPlayerCost =
    match?.entryFee && match.currentPlayers > 0
      ? Math.ceil(match.entryFee / match.currentPlayers)
      : null;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-20">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Match not found</h2>
        <p className="text-muted-foreground mb-4">{error || 'This match may have been removed.'}</p>
        <Button onClick={() => router.push('/')}>Back to Map</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    open: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200',
    full: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200',
    cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200',
    completed: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200',
    in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200',
  };

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {isHost && isEnded && (
          <Button
            size="sm"
            onClick={() => setAttendanceModalOpen(true)}
            className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Mark Attendance
          </Button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Header section */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-2xl">{getSportEmoji(match.sportId)}</span>
            <Badge
              variant="outline"
              className={cn('capitalize', statusColors[match.status])}
            >
              {isEnded
                ? 'Concluded'
                : match.status === 'open' && slotsLeft <= 2
                ? `${slotsLeft} spot${slotsLeft !== 1 ? 's' : ''} left!`
                : match.status}
            </Badge>

            {isHost && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Crown className="w-3 h-3 mr-1" />
                Host
              </Badge>
            )}

            {currentParticipant && !isHost && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Already Joined ({currentParticipant.role === 'player' ? 'Player' : 'Cheerer'})
              </Badge>
            )}

            {Boolean(match.minReliability && match.minReliability > 0) && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Min Karma: {match.minReliability}%
              </Badge>
            )}

            {match.isTournament && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                🏆 {match.tournamentName || 'Verified Community Tournament'}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight">{match.title}</h1>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Venue</p>
              <p className="text-sm font-medium">{match.venueName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{formatDate(match.date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Time & Duration</p>
              <p className="text-sm font-medium">
                {formatTime(match.date)} · {match.durationMinutes}min
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Entry Fee & Split</p>
              <p className="text-sm font-medium">
                {match.entryFee ? (
                  <>
                    <span>৳{match.entryFee} total</span>
                    {perPlayerCost && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">
                        ৳{perPlayerCost}/player ({match.currentPlayers} joined)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-emerald-600 font-semibold">Free Match</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Slots progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Player Slots</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {match.currentPlayers} / {match.maxPlayers} players
            </span>
          </div>
          <SlotsProgress current={match.currentPlayers} max={match.maxPlayers} />
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold mb-2">About this match</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {match.description}
          </p>
        </div>

        {/* Mini Map */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Location</h3>
          <MiniMap
            location={match.location}
            sportId={match.sportId}
            venueName={match.venueName}
          />
        </div>

        <Separator />

        {/* Players list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Confirmed Players ({players.length}/{match.maxPlayers})
            </h3>
          </div>
          {players.length > 0 ? (
            <div className="space-y-2">
              {players.map(p => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/profile/${p.userId}`)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                  title={`View ${p.user.name}'s profile`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {p.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate hover:text-primary transition-colors">{p.user.name}</p>
                      {p.userId === match.hostId && (
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      {p.status === 'attended' && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Attended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.user.matchesPlayed} matches played
                    </p>
                  </div>
                  <ReliabilityBadge score={p.user.reliabilityScore} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No players yet. Be the first!</p>
          )}
        </div>

        {/* Spectators / Cheerers */}
        {spectators.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold">
                Cheerers & Spectators ({spectators.length})
              </h3>
            </div>
            <PlayerAvatarRow participants={spectators} max={10} />
          </div>
        )}

        {/* Host info */}
        <div
          onClick={() => router.push(`/profile/${match.hostId}`)}
          className="p-3.5 rounded-xl bg-muted/40 border space-y-2.5 cursor-pointer hover:bg-muted/60 transition-colors"
          title="View organizer's profile"
        >
          <p className="text-xs text-muted-foreground">Organized by</p>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {(match.organizedBy || match.host?.name || 'Organizer').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium hover:text-primary transition-colors">
                {match.organizedBy || match.host?.name || 'Organizer'}
              </p>
              <p className="text-xs text-muted-foreground">
                {match.host?.matchesHosted || 1} matches hosted
              </p>
            </div>
            <ReliabilityBadge score={match.host?.reliabilityScore ?? 100} size="sm" />
          </div>
          {match.contactDetails && (
            <div className="pt-2 border-t text-xs flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Contact: <span className="text-foreground font-medium">{match.contactDetails}</span></span>
            </div>
          )}
        </div>

        <Separator />

        {/* Embedded Lobby Chat */}
        <div>
          <MatchLobbyChat
            match={match}
            currentUser={user}
            isHost={Boolean(isHost)}
            isParticipant={Boolean(currentParticipant)}
            userRole={currentParticipant?.role}
            isEnded={isEnded}
          />
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-3 sm:p-4 z-20">
        <div className="max-w-2xl mx-auto flex gap-2.5 items-center">
          {isEnded ? (
            isHost ? (
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setAttendanceModalOpen(true)}
              >
                <Award className="w-4 h-4 mr-2" />
                Mark Attendance & Update Karma
              </Button>
            ) : (
              <Button className="flex-1" variant="outline" disabled>
                Match has Concluded
              </Button>
            )
          ) : isHost ? (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1">
                {isPlayer ? (
                  <Button
                    variant="outline"
                    className="flex-1 text-xs border-amber-500/40 text-amber-700 dark:text-amber-400"
                    onClick={handleLeave}
                    disabled={leaving}
                  >
                    {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserMinus className="w-3.5 h-3.5 mr-1.5" />}
                    Leave Player Slot
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => openJoinModal('player')}
                    disabled={joining !== null || isFull}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    {isFull ? 'Slots Full' : 'Play (Join as Player)'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => router.push(`/matches/create?edit=${matchId}`)}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
              <Button
                variant="destructive"
                className="sm:w-auto text-xs"
                onClick={handleCancel}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Cancel Match
              </Button>
            </div>
          ) : currentParticipant ? (
            <Button
              variant="outline"
              className="flex-1 border-primary/30 text-primary font-medium"
              onClick={handleLeave}
              disabled={leaving}
            >
              {leaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserMinus className="w-4 h-4 mr-2" />
              )}
              Already Joined · Leave Match ({isPlayer ? 'Player' : 'Cheerer'})
            </Button>
          ) : (
            <>
              {/* Player Join Button */}
              <Button
                className="flex-1"
                onClick={() => openJoinModal('player')}
                disabled={joining !== null || isFull}
              >
                {joining === 'player' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isFull ? 'Player Slots Full' : `Play (${slotsLeft} left)`}
              </Button>

              {/* Spectator Join Button */}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => openJoinModal('spectator')}
                disabled={joining !== null}
              >
                {joining === 'spectator' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Cheer / Watch
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              showToast('Match link copied to clipboard!', 'success');
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Join with Username Modal */}
      <Dialog open={joinModalOpen} onOpenChange={(open) => { if (!open) setJoinModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {joinRole === 'player' ? 'Join as Player' : 'Join as Cheer/Spectator'}
            </DialogTitle>
            <DialogDescription>
              Enter the username or nickname you want other players to see during this match.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmJoin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="join-username">Your Username / Name</Label>
              <Input
                id="join-username"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                placeholder="e.g. sakib7, rafiq_dhaka"
                autoFocus
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
              <p className="font-semibold text-foreground">Match: {match.title}</p>
              <p className="text-muted-foreground">{match.venueName} · {formatDate(match.date)}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                Role: {joinRole === 'player' ? 'Confirmed Player' : 'Spectator / Cheer'}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setJoinModalOpen(false)}
                disabled={joining !== null}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={joining !== null || !joinUsername.trim()}
              >
                {joining !== null ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Confirm & Join
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Modal */}
      {isHost && (
        <AttendanceModal
          match={match}
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          onSuccess={(updated) => setMatch(updated)}
        />
      )}
    </div>
  );
}
