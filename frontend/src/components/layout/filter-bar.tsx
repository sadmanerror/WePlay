'use client';

import React from 'react';
import { SPORTS, RADIUS_OPTIONS } from '@/lib/constants';
import { Chip } from '@/components/shared';
import { Calendar } from 'lucide-react';
import { create } from 'zustand';

// Assuming filter store structure based on requirements
interface FilterState {
  sports: string[];
  radius: number;
  date: string;
  toggleSport: (sport: string) => void;
  setRadius: (radius: number) => void;
  setDate: (date: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  sports: [],
  radius: 5,
  date: 'today',
  toggleSport: (sport) => set((state) => ({
    sports: state.sports.includes(sport)
      ? state.sports.filter(s => s !== sport)
      : [...state.sports, sport]
  })),
  setRadius: (radius) => set({ radius }),
  setDate: (date) => set({ date }),
}));

export function FilterBar() {
  const { sports, radius, date, toggleSport, setRadius, setDate } = useFilterStore();

  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'weekend', label: 'This Weekend' },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar border-b border-border bg-background py-3">
      <div className="flex items-center gap-4 px-4 min-w-max">
        {/* Sports */}
        <div className="flex items-center gap-2 border-r border-border pr-4">
          {SPORTS.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              icon={<span>{s.emoji}</span>}
              selected={sports.includes(s.id)}
              onClick={() => toggleSport(s.id)}
              color={s.color}
            />
          ))}
        </div>

        {/* Radius */}
        <div className="flex items-center gap-2 border-r border-border pr-4">
          <select 
            value={radius} 
            onChange={(e) => setRadius(Number(e.target.value))}
            className="h-8 rounded-full border border-border bg-background px-3 py-1 text-sm outline-none focus:border-primary flex items-center"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2">
          {dateOptions.map((d) => (
            <Chip
              key={d.value}
              label={d.label}
              selected={date === d.value}
              onClick={() => setDate(d.value)}
              icon={d.value === 'today' ? <Calendar className="w-4 h-4" /> : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
