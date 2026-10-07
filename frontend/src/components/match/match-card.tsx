'use client';

import { MapPin, Clock, User, Phone } from 'lucide-react';
import { cn, formatDate, formatTime, getSportEmoji, getSportColor, isOngoingEvent } from '@/lib/utils';
import { MATCH_STATUS } from '@/lib/constants';
import { SlotsProgress } from './slots-progress';
import { PlayerAvatarRow } from './player-avatar-row';
import { Match } from '@/types';

interface MatchCardProps {
  match: Match;
  onClick?: (id: string) => void;
  className?: string;
}

export function MatchCard({ match, onClick, className }: MatchCardProps) {
  const ongoing = isOngoingEvent(match);
  const isFull = match.currentPlayers >= match.maxPlayers || match.status === MATCH_STATUS.FULL;

  const players = match.participants?.filter(p => p.role === 'player') || [];

  return (
    <div 
      onClick={() => onClick?.(match.id)}
      className={cn(
        "bg-card border border-border rounded-card p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-xs",
            getSportColor(match.sportId)
          )}>
            <span>{getSportEmoji(match.sportId)}</span>
            <span className="capitalize">{match.sportId}</span>
          </div>

          {match.isTournament && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              🏆 Tournament
            </div>
          )}
        </div>

        {ongoing ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            ONGOING
          </div>
        ) : isFull ? (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider">
            FULL
          </div>
        ) : (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
            OPEN FOR REGISTER
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-base line-clamp-1 text-foreground">
          {match.title}
        </h3>
        
        <div className="flex flex-col gap-1 mt-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{match.venueName}</span>
            {match.distance !== undefined && (
              <span className="text-[11px] border-l border-border pl-1.5 shrink-0 text-primary font-medium">
                {match.distance < 1 ? `${Math.round(match.distance * 1000)}m` : `${match.distance.toFixed(1)}km`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(match.date)} • {formatTime(match.date)}</span>
          </div>
          {match.organizedBy && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <User className="w-3 h-3 shrink-0 text-muted-foreground" />
              <span className="truncate">Organized by: <strong className="text-foreground">{match.organizedBy}</strong></span>
            </div>
          )}
          {match.contactDetails && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <Phone className="w-3 h-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{match.contactDetails}</span>
            </div>
          )}
        </div>
      </div>

      <SlotsProgress 
        current={match.currentPlayers} 
        max={match.maxPlayers} 
      />

      <div className="flex justify-between items-center pt-2 border-t border-border mt-auto">
        <PlayerAvatarRow participants={players} />
        <div className="text-right">
          {!match.entryFee ? (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
              Free
            </span>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold">৳{match.entryFee}</span>
              {match.currentPlayers > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ৳{Math.ceil(match.entryFee / match.currentPlayers)}/player
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export type { Match } from '@/types';
