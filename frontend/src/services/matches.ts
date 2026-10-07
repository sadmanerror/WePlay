import { Match, CreateMatchInput, UpdateMatchInput, ParticipantRole, MatchFilters } from '../types';
import { apiFetch } from './api-client';
import { isFinishedEvent } from '@/lib/utils';

export const getMatches = async (filters?: Partial<MatchFilters>): Promise<Match[]> => {
  const queryParams = new URLSearchParams();
  if (filters?.sports && filters.sports.length > 0) {
    filters.sports.forEach(s => queryParams.append('sports', s));
  }
  if (filters?.center) {
    queryParams.append('lat', String(filters.center.lat));
    queryParams.append('lng', String(filters.center.lng));
  }
  if (filters?.radius) {
    queryParams.append('radius', String(filters.radius));
  }
  if (filters?.status && filters.status.length > 0) {
    filters.status.forEach(st => queryParams.append('status', st));
  }

  const queryStr = queryParams.toString();
  const url = `/matches/${queryStr ? `?${queryStr}` : ''}`;
  const data = await apiFetch<Match[]>(url);
  return data.filter(m => !isFinishedEvent(m));
};

export const getMatchById = async (id: string): Promise<Match> => {
  return await apiFetch<Match>(`/matches/${id}`);
};

export const createMatch = async (input: CreateMatchInput): Promise<Match> => {
  return await apiFetch<Match>('/matches/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};

export const joinMatch = async (
  matchId: string,
  userId: string,
  role: ParticipantRole = 'player',
  username?: string
): Promise<Match> => {
  return await apiFetch<Match>(`/matches/${matchId}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ role, username }),
  });
};

export const leaveMatch = async (matchId: string, userId: string): Promise<Match> => {
  return await apiFetch<Match>(`/matches/${matchId}/rsvp?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
};

export const updateMatch = async (id: string, input: UpdateMatchInput): Promise<Match> => {
  return await apiFetch<Match>(`/matches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
};

export const cancelMatch = async (id: string): Promise<Match> => {
  return await apiFetch<Match>(`/matches/${id}`, {
    method: 'DELETE',
  });
};

export const markAttendance = async (
  matchId: string,
  attendance: { userId: string; status: 'attended' | 'no_show' }[]
): Promise<Match> => {
  return await apiFetch<Match>(`/matches/${matchId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ attendance }),
  });
};
