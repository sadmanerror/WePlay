'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReliabilityBadge } from '@/components/profile/reliability-badge';
import { Chip } from '@/components/shared/chip';
import { MatchCard } from '@/components/match/match-card';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/components/shared/toast';
import { SPORTS } from '@/lib/constants';
import { SportId, Match, User } from '@/types';
import * as matchService from '@/services/matches';
import * as userService from '@/services/users';
import {
  User as UserIcon, Calendar,
  Edit2, LogOut, Check, Clock, Users, Loader2
} from 'lucide-react';

function countWords(str: string): number {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [description, setDescription] = useState(user?.description || user?.bio || '');
  const [preferredSports, setPreferredSports] = useState<SportId[]>(user?.preferredSports || []);
  const [prevUserId, setPrevUserId] = useState(user?.id);
  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setName(user.name);
    setDescription(user.description || user.bio || '');
    setPreferredSports(user.preferredSports || []);
  }

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      if (!user) return;
      try {
        const all = await matchService.getMatches();
        if (!ignore) {
          const relevant = all.filter(
            m => m.hostId === user.id || m.participants?.some(p => p.userId === user.id)
          );
          setUserMatches(relevant);
        }
      } catch {
        // quiet error in mock
      }

      setListsLoading(true);
      try {
        const [followers, following] = await Promise.all([
          userService.getFollowers(user.id),
          userService.getFollowing(user.id),
        ]);
        if (!ignore) {
          setFollowersList(followers);
          setFollowingList(following);
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) setListsLoading(false);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [user]);

  const toggleSport = (sportId: SportId) => {
    setPreferredSports(prev =>
      prev.includes(sportId)
        ? prev.filter(s => s !== sportId)
        : [...prev, sportId]
    );
  };

  const wordCount = countWords(description);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (wordCount > 200) {
      showToast('Description exceeds the 200-word limit. Please shorten it.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        description: description.trim(),
        bio: description.trim(),
        preferredSports,
      });
      setIsEditing(false);
      showToast('Profile updated successfully! ✨', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Track matches you hosted or joined, review your reliability rating, and customize your favorite sports.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/login')}>Sign in</Button>
          <Button variant="outline" onClick={() => router.push('/register')}>
            Register
          </Button>
        </div>
      </div>
    );
  }

  const upcomingMatches = userMatches.filter(m => m.status === 'open' || m.status === 'full');
  const pastMatches = userMatches.filter(m => m.status === 'completed' || m.status === 'cancelled');

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28 space-y-6">
      {/* Profile Card */}
      <div className="p-6 rounded-card border bg-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-brand-500/20 via-brand-400/20 to-brand-600/20" />

        <div className="relative pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-background bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <ReliabilityBadge score={user.reliabilityScore} />
              </div>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Member since {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs font-medium">
                <span>
                  <strong className="text-foreground font-semibold">{user.followersCount ?? followersList.length}</strong>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </span>
                <span>
                  <strong className="text-foreground font-semibold">{user.followingCount ?? followingList.length}</strong>{' '}
                  <span className="text-muted-foreground">Following</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Description / Edit section */}
        <div className="mt-6 pt-4 border-t">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs">Full Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Description with 200 word limit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-description" className="text-xs font-semibold">
                    Description (max 200 words)
                  </Label>
                  <span className={`text-[11px] font-mono ${wordCount > 200 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                    {wordCount} / 200 words
                  </span>
                </div>
                <Textarea
                  id="edit-description"
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell other sports enthusiasts about yourself, playing positions, experience, or timings..."
                  className={`text-sm resize-none ${wordCount > 200 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {wordCount > 200 && (
                  <p className="text-xs text-destructive">
                    Your description exceeds the 200-word limit by {wordCount - 200} words.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Preferred Sports</Label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map(s => (
                    <Chip
                      key={s.id}
                      label={`${s.emoji} ${s.name}`}
                      selected={preferredSports.includes(s.id)}
                      onClick={() => toggleSport(s.id)}
                      color={s.color}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </h3>
                {user.description || user.bio ? (
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {user.description || user.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description written yet. Tap Edit to add your profile description (up to 200 words)!
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {user.preferredSports.map(sportId => {
                  const sport = SPORTS.find(s => s.id === sportId);
                  return (
                    <Badge key={sportId} variant="secondary" className="text-xs">
                      {sport?.emoji} {sport?.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t text-center">
          <div className="p-2 rounded-lg bg-muted/40">
            <p className="text-xl font-bold text-primary">{user.matchesPlayed}</p>
            <p className="text-xs text-muted-foreground">Matches Played</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40">
            <p className="text-xl font-bold text-foreground">{user.matchesHosted}</p>
            <p className="text-xs text-muted-foreground">Matches Hosted</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40">
            <p className="text-xl font-bold text-emerald-600">{user.reliabilityScore}%</p>
            <p className="text-xs text-muted-foreground">Reliability Karma</p>
          </div>
        </div>
      </div>

      {/* Tabs: Matches, Followers, Following */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastMatches.length})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Followers ({followersList.length})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({followingList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={() => router.push(`/matches/${m.id}`)}
              />
            ))
          ) : (
            <div className="p-8 text-center border rounded-card bg-card text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No upcoming matches</p>
              <p className="text-xs mt-1">Explore the map or host your own match!</p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => router.push('/')}
              >
                Find Matches
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {pastMatches.length > 0 ? (
            pastMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={() => router.push(`/matches/${m.id}`)}
              />
            ))
          ) : (
            <div className="p-8 text-center border rounded-card bg-card text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No match history yet</p>
              <p className="text-xs mt-1">Matches you attend will appear here.</p>
            </div>
          )}
        </TabsContent>

        {/* Followers Tab */}
        <TabsContent value="followers" className="mt-4 space-y-2">
          {listsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : followersList.length > 0 ? (
            followersList.map(follower => (
              <div
                key={follower.id}
                onClick={() => router.push(`/profile/${follower.id}`)}
                className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {follower.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{follower.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {follower.description || follower.bio || `${follower.matchesPlayed} matches played`}
                    </p>
                  </div>
                </div>
                <ReliabilityBadge score={follower.reliabilityScore} size="sm" />
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-xl border bg-card">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No followers yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="mt-4 space-y-2">
          {listsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : followingList.length > 0 ? (
            followingList.map(followed => (
              <div
                key={followed.id}
                onClick={() => router.push(`/profile/${followed.id}`)}
                className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {followed.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{followed.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {followed.description || followed.bio || `${followed.matchesPlayed} matches played`}
                    </p>
                  </div>
                </div>
                <ReliabilityBadge score={followed.reliabilityScore} size="sm" />
              </div>
            ))
          ) : (
            <div className="p-8 text-center rounded-xl border bg-card">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Not following anyone yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
