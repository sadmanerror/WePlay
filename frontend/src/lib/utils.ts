import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 60) return diffMins > 0 ? `in ${diffMins}m` : `${Math.abs(diffMins)}m ago`;
  if (Math.abs(diffHours) < 24) return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
}

export function getDistanceText(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export function getSportEmoji(sport: string): string {
  const map: Record<string, string> = {
    cricket: '🏏',
    football: '⚽',
    basketball: '🏀',
    badminton: '🏸',
  };
  return map[sport.toLowerCase()] || '🎯';
}

export function getSportColor(sport: string): string {
  const map: Record<string, string> = {
    cricket: 'bg-sport-cricket',
    football: 'bg-sport-football',
    basketball: 'bg-sport-basketball',
    badminton: 'bg-sport-badminton',
  };
  return map[sport.toLowerCase()] || 'bg-brand-500';
}

export function getSportTextColor(sport: string): string {
  const map: Record<string, string> = {
    cricket: 'text-sport-cricket',
    football: 'text-sport-football',
    basketball: 'text-sport-basketball',
    badminton: 'text-sport-badminton',
  };
  return map[sport.toLowerCase()] || 'text-brand-500';
}

export function isFinishedEvent(event: { date?: string | Date; durationMinutes?: number; status?: string; isEnded?: boolean }): boolean {
  if (event.isEnded || event.status === 'completed' || event.status === 'cancelled') {
    return true;
  }
  if (!event.date) return false;
  const startTime = new Date(event.date).getTime();
  if (isNaN(startTime)) return false;
  const durationMs = (event.durationMinutes || 90) * 60 * 1000;
  return Date.now() > startTime + durationMs;
}

export function isOngoingEvent(event: { date?: string | Date; durationMinutes?: number; status?: string; isEnded?: boolean }): boolean {
  if (isFinishedEvent(event)) return false;
  if (!event.date) return false;
  const startTime = new Date(event.date).getTime();
  if (isNaN(startTime)) return false;
  const durationMs = (event.durationMinutes || 90) * 60 * 1000;
  const now = Date.now();
  return now >= startTime && now <= startTime + durationMs;
}

