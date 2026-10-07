import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-xl p-4 w-full bg-card shadow-sm space-y-4 animate-pulse", className)}>
      <div className="flex justify-between items-start">
        <div className="h-6 bg-muted rounded-full w-24"></div>
        <div className="h-5 bg-muted rounded-full w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
      <div className="h-2 bg-muted rounded-full w-full mt-4"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background"></div>
          ))}
        </div>
        <div className="h-6 bg-muted rounded w-12"></div>
      </div>
    </div>
  );
}
