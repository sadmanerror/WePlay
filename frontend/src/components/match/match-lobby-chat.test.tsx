import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchLobbyChat } from './match-lobby-chat';
import { Match, User } from '@/types';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockUser: User = {
  id: 'u1',
  name: 'Test Player',
  email: 'player@example.com',
  avatarUrl: null,
  preferredSports: ['cricket'],
  reliabilityScore: 92,
  matchesPlayed: 10,
  matchesHosted: 2,
  joinedAt: '2026-01-01T00:00:00Z',
  bio: '',
};

const activeMatch: Match = {
  id: 'm-active',
  hostId: 'u1',
  host: mockUser,
  sportId: 'cricket',
  title: 'Active Pickup Match',
  venueName: 'Dhanmondi Field',
  location: { lat: 23.75, lng: 90.38 },
  date: new Date(Date.now() + 3600000).toISOString(), // 1 hour in future
  durationMinutes: 90,
  maxPlayers: 10,
  currentPlayers: 4,
  maxSpectators: null,
  currentSpectators: 1,
  entryFee: null,
  minReliability: 0,
  description: 'Come play cricket',
  status: 'open',
  isEnded: false,
  createdAt: new Date().toISOString(),
};

const endedMatch: Match = {
  ...activeMatch,
  id: 'm-ended',
  title: 'Ended Pickup Match',
  date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  isEnded: true,
  status: 'completed',
};

describe('MatchLobbyChat component', () => {
  it('renders active lobby chat header and live badge', () => {
    render(
      <MatchLobbyChat
        match={activeMatch}
        currentUser={mockUser}
        isHost={true}
        isParticipant={true}
        isEnded={false}
      />
    );
    expect(screen.getByText('Match Lobby Chat')).toBeTruthy();
    expect(screen.getByText('Live')).toBeTruthy();
  });

  it('renders closed & erased state when match has concluded', () => {
    render(
      <MatchLobbyChat
        match={endedMatch}
        currentUser={mockUser}
        isHost={true}
        isParticipant={true}
        isEnded={true}
      />
    );
    expect(screen.getByText(/Match Concluded · Chatroom Closed/i)).toBeTruthy();
    expect(
      screen.getByText(/the match lobby chat is closed and all messages have been automatically erased/i)
    ).toBeTruthy();
    expect(screen.queryByPlaceholderText(/Coordinate gear/i)).toBeNull();
  });
});
