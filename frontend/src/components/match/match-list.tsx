import { Plus, PlusCircle } from 'lucide-react';
import { MatchCard, Match } from './match-card';
import { SkeletonCard } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface MatchListProps {
  matches: Match[];
  loading: boolean;
  onMatchClick: (id: string) => void;
  onCreateEvent?: () => void;
}

export function MatchList({ matches, loading, onMatchClick, onCreateEvent }: MatchListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border rounded-card bg-card/60">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          <PlusCircle className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-base mb-1 text-foreground">No events yet</h3>
        <p className="text-xs text-muted-foreground max-w-xs mb-5">
          Be the first to host a pickup event! Create your event and pin the location directly on the map.
        </p>
        {onCreateEvent && (
          <Button
            onClick={onCreateEvent}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium shadow-sm flex items-center justify-center gap-2 py-5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onClick={onMatchClick}
        />
      ))}
    </div>
  );
}
