import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchCard } from './match-card';
import { Match, User } from '@/types';

const mockHost: User = {
  id: 'u1',
  name: 'Tournament Host',
  email: 'host@example.com',
  avatarUrl: null,
  preferredSports: ['football'],
  reliabilityScore: 95,
  matchesPlayed: 25,
  matchesHosted: 8,
  joinedAt: '2026-01-01T00:00:00Z',
  bio: '',
};

const tournamentMatch: Match = {
  id: 'm-tourney',
  hostId: 'u1',
  host: mockHost,
  sportId: 'football',
  title: 'Banani Champions Trophy',
  venueName: 'Apex Arena Football Turf',
  location: { lat: 23.7937, lng: 90.4066 },
  date: '2026-10-10T18:00:00Z',
  durationMinutes: 90,
  maxPlayers: 12,
  currentPlayers: 6,
  maxSpectators: null,
  currentSpectators: 2,
  entryFee: 1200,
  isTournament: true,
  tournamentName: 'Banani Champions Trophy',
  description: 'Annual neighborhood championship',
  status: 'open',
  createdAt: '2026-10-01T00:00:00Z',
};

describe('MatchCard component', () => {
  it('renders tournament badge and cost-split breakdown', () => {
    render(<MatchCard match={tournamentMatch} />);
    expect(screen.getByText(/🏆 Tournament/i)).toBeTruthy();
    expect(screen.getByText('Banani Champions Trophy')).toBeTruthy();
    // Dynamic per-player cost: 1200 / 6 = 200
    expect(screen.getByText('৳200/player')).toBeTruthy();
  });
});
