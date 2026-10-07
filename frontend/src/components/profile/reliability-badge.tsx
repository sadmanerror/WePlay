import { Star, ThumbsUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReliabilityBadgeProps {
  score: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function ReliabilityBadge({ score, className, size = 'md' }: ReliabilityBadgeProps) {

  let config = {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: 'Low',
  };

  if (score >= 90) {
    config = {
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: Star,
      label: 'Reliable',
    };
  } else if (score >= 70) {
    config = {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: ThumbsUp,
      label: 'Good',
    };
  } else if (score >= 50) {
    config = {
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: AlertCircle,
      label: 'Needs Improvement',
    };
  }

  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center rounded-full font-medium border",
      size === 'sm' ? "gap-1 px-2 py-0.5 text-[10px]" : "gap-1.5 px-2.5 py-1 text-xs",
      config.color,
      className
    )}>
      <Icon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{config.label}</span>
      <span className="opacity-70 ml-0.5 border-l border-current pl-1">
        {score}%
      </span>
    </div>
  );
}

