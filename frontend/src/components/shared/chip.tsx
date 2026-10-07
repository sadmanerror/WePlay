'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  selected?: boolean;
  color?: string; // Hex or CSS color
  icon?: React.ReactNode;
}

export function Chip({ label, selected = false, onClick, color, icon, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
        selected
          ? "border-transparent text-white bg-primary"
          : "border-border text-foreground hover:bg-muted",
        className
      )}
      style={selected && color ? { backgroundColor: color } : {}}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </button>
  );
}
