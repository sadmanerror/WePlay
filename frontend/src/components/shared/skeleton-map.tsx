import { cn } from '@/lib/utils';

export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-full min-h-[300px] bg-muted animate-pulse rounded-lg flex items-center justify-center", className)}>
      <div className="text-muted-foreground/50">Loading map...</div>
    </div>
  );
}
