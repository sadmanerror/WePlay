export const SPORTS = [
  { id: 'cricket', name: 'Cricket', emoji: '🏏', color: '#10b981' },
  { id: 'football', name: 'Football', emoji: '⚽', color: '#3b82f6' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', color: '#f97316' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', color: '#8b5cf6' },
] as const;

export const RADIUS_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
] as const;

export const MATCH_STATUS = {
  OPEN: 'open',
  FULL: 'full',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
} as const;

export const DEFAULT_CENTER: [number, number] = [23.7937, 90.4066]; // Dhaka
export const DEFAULT_ZOOM = 13;

export const PARTICIPANT_ROLE = {
  PLAYER: 'player',
  SPECTATOR: 'spectator',
} as const;
