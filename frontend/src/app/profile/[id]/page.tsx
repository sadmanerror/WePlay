'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReliabilityBadge } from '@/components/profile/reliability-badge';
import { MatchCard } from '@/components/match/match-card';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/components/shared/toast';
import { SPORTS } from '@/lib/constants';
import { User, Match } from '@/types';
import * as userService from '@/services/users';
import * as matchService from '@/services/matches';
import {
  User as UserIcon, Calendar, ArrowLeft,
  UserPlus, UserCheck, Users, Loader2, Trophy, Flame
} from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const isOwnProfile = currentUser && currentUser.id === userId;

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      setError(null);
      try {
        const u = await userService.getUser(userId);
        setProfileUser(u);
        setIsFollowing(Boolean(u.isFollowing));
        setFollowersCount(u.followersCount ?? 0);
        setFollowingCount(u.followingCount ?? 0);

        // Fetch user matches
        try {
          const allMatches = await matchService.getMatches();
          const relevant = allMatches.filter(
            m => m.hostId === userId || m.participants?.some(p => p.userId === userId)
          );
          setUserMatches(relevant);
        } catch {
          // ignore match loading errors
        }

        // Fetch followers and following
        setListsLoading(true);
        const [followers, following] = await Promise.all([
          userService.getFollowers(userId),
          userService.getFollowing(userId),
        ]);
        setFollowersList(followers);
        setFollowingList(following);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'User not found');
      } finally {
        setLoading(false);
        setListsLoading(false);
      }
    }

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Please sign in to follow players', 'error');
      router.push('/login');
      return;
    }

    if (isOwnProfile) return;

    setFollowLoading(true);
    try {
      const res = await userService.toggleFollow(userId);
      setIsFollowing(res.is_following);
      setFollowersCount(res.followers_count);
      showToast(res.is_following ? `Following ${profileUser?.name}!` : `Unfollowed ${profileUser?.name}`, 'success');

      // Refresh followers list
      const updatedFollowers = await userService.getFollowers(userId);
      setFollowersList(updatedFollowers);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update follow status', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-20">
        <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">User Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error || 'This user profile could not be found or has been removed.'}
        </p>
        <Button onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    );
  }

  const initials = profileUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  const displayDescription = profileUser.description || profileUser.bio || '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

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
                <h1 className="text-xl font-bold">{profileUser.name}</h1>
                <ReliabilityBadge score={profileUser.reliabilityScore} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Member since {new Date(profileUser.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs font-medium">
                <span>
                  <strong className="text-foreground font-semibold">{followersCount}</strong>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </span>
                <span>
                  <strong className="text-foreground font-semibold">{followingCount}</strong>{' '}
                  <span className="text-muted-foreground">Following</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile')}
              >
                Edit Your Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={handleToggleFollow}
                disabled={followLoading}
                className="gap-1.5 min-w-[110px]"
              >
                {followLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-6 pt-4 border-t space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </h3>
          {displayDescription ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {displayDescription}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description written yet.
            </p>
          )}

          {/* Preferred sports tags */}
          {profileUser.preferredSports && profileUser.preferredSports.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profileUser.preferredSports.map(sportId => {
                const sport = SPORTS.find(s => s.id === sportId);
                return (
                  <Badge key={sportId} variant="secondary" className="text-xs">
                    {sport?.emoji} {sport?.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border bg-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{profileUser.matchesPlayed}</p>
            <p className="text-xs text-muted-foreground">Matches Played</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{profileUser.matchesHosted}</p>
            <p className="text-xs text-muted-foreground">Matches Hosted</p>
          </div>
        </div>
      </div>

      {/* Tabs: Matches, Followers, Following */}
      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches">
            Matches ({userMatches.length})
          </TabsTrigger>
          <TabsTrigger value="followers">
            Followers ({followersList.length})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({followingList.length})
          </TabsTrigger>
        </TabsList>

        {/* Matches Tab */}
        <TabsContent value="matches" className="mt-4 space-y-3">
          {userMatches.length > 0 ? (
            userMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onClick={() => router.push(`/matches/${match.id}`)}
              />
            ))
          ) : (
            <div className="p-8 text-center rounded-xl border bg-card">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No matches found for this user.</p>
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

