import { cn } from '@/lib/utils';
import { MatchParticipant } from '@/types';

interface PlayerAvatarRowProps {
  participants: MatchParticipant[];
  max?: number;
  className?: string;
}

export function PlayerAvatarRow({ participants = [], max = 5, className }: PlayerAvatarRowProps) {
  const visiblePlayers = participants.slice(0, max);
  const overflow = participants.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visiblePlayers.map((p) => {
        const name = p.user?.name || 'Player';
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div 
            key={p.id} 
            className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center relative group"
            title={name}
          >
            {p.user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.user.avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground">
                {initials}
              </span>
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10">
          <span className="text-[10px] font-medium text-muted-foreground">
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}
