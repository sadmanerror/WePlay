// ============================================================
// Weplay — Shared TypeScript Types
// ============================================================

export type SportId = 'cricket' | 'football' | 'basketball' | 'badminton';

export type MatchStatus = 'open' | 'full' | 'cancelled' | 'completed' | 'in_progress';

export type ParticipantRole = 'player' | 'spectator';

export type ParticipantStatus = 'confirmed' | 'cancelled' | 'no_show' | 'attended';

// ---- User ----
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  preferredSports: SportId[];
  reliabilityScore: number; // 0-100
  matchesPlayed: number;
  matchesHosted: number;
  joinedAt: string; // ISO date
  bio: string;
  description?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ---- Sport ----
export interface Sport {
  id: SportId;
  name: string;
  emoji: string;
  color: string;
}

// ---- Location ----
export interface LatLng {
  lat: number;
  lng: number;
}

// ---- Match ----
export interface Match {
  id: string;
  hostId: string;
  host: User;
  sportId: SportId;
  title: string;
  venueName: string;
  location: LatLng;
  date: string; // ISO datetime
  durationMinutes: number;
  maxPlayers: number;
  currentPlayers: number;
  maxSpectators: number | null; // null = unlimited
  currentSpectators: number;
  entryFee: number | null; // in BDT, null = free
  minReliability?: number; // 0-100 minimum karma threshold
  isTournament?: boolean;
  tournamentName?: string | null;
  organizedBy?: string;
  contactDetails?: string;

  description: string;
  status: MatchStatus;
  isEnded?: boolean;
  createdAt: string;
  distance?: number; // km from user, computed
  participants?: MatchParticipant[];
}

// ---- Match Participant ----
export interface MatchParticipant {
  id: string;
  userId: string;
  user: User;
  matchId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: string;
}

// ---- Chat Message ----
export interface ChatMessage {
  id: string;
  matchId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

// ---- Filters ----
export interface MatchFilters {
  sports: SportId[];
  radius: number; // km
  date: string | null; // ISO date or null for "any"
  status: MatchStatus[];
  center: LatLng;
}

// ---- API Response wrappers ----
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Create / Update DTOs ----
export interface CreateMatchInput {
  sportId: SportId;
  title: string;
  venueName: string;
  location: LatLng;
  date: string;
  durationMinutes: number;
  maxPlayers: number;
  maxSpectators?: number | null;
  entryFee?: number | null;
  minReliability?: number;
  isTournament?: boolean;
  tournamentName?: string | null;
  organizedBy?: string;
  contactDetails?: string;
  description: string;
}

export interface UpdateMatchInput {
  title?: string;
  venueName?: string;
  location?: LatLng;
  date?: string;
  durationMinutes?: number;
  maxPlayers?: number;
  maxSpectators?: number | null;
  entryFee?: number | null;
  minReliability?: number;
  isTournament?: boolean;
  tournamentName?: string | null;
  description?: string;
  status?: MatchStatus;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  preferredSports: SportId[];
}

export interface LoginInput {
  email: string;
  password: string;
}

// ---- Venue (Phase 3 scaffold) ----
export interface VenueSlot {
  id: string;
  venueId: string;
  startTime: string;
  endTime: string;
  price: number;
  isOffPeak: boolean;
  isBooked: boolean;
}

export interface Venue {
  id: string;
  ownerId?: string | null;
  name: string;
  location: LatLng;
  address: string;
  sports: SportId[];
  imageUrl: string | null;
  hourlyRate: number;
  rating: number;
  isVerified: boolean;
  contactPerson?: string;
  contactPhone?: string;
  amenities?: string[];
  surfaceType?: string;
  slots?: VenueSlot[];
  createdAt?: string;
}

export interface CreateVenueInput {
  name: string;
  address: string;
  location: LatLng;
  sports: SportId[];
  hourlyRate: number;
  offPeakRate?: number;
  contactPerson?: string;
  contactPhone?: string;
  surfaceType?: string;
  amenities?: string[];
  imageUrl?: string | null;
  openingHour?: number;
  closingHour?: number;
}

export interface VenueReservation {
  id: string;
  venueId: string;
  slotId: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
  slot?: VenueSlot;
}

