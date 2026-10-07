import { cn } from '@/lib/utils';

interface SlotsProgressProps {
  current: number;
  max: number;
  label?: string;
}

export function SlotsProgress({ current, max, label }: SlotsProgressProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  let colorClass = 'bg-emerald-500';
  if (percentage >= 100) colorClass = 'bg-red-500';
  else if (percentage >= 70) colorClass = 'bg-amber-500';

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{label || 'Players'}</span>
        <span className="font-medium text-foreground">
          {current} / {max}
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
