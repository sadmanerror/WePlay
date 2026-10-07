import { Match } from '@/types';

// ============================================================
// Demo Matches (Cleared - events will be created live by users)
// ============================================================

export const mockMatches: Match[] = [];

export function getMatchById(id: string): Match | undefined {
  return mockMatches.find(m => m.id === id);
}
