'use client';

import { create } from 'zustand';
import { SportId, LatLng } from '../types';

interface FilterState {
  sports: SportId[];
  radius: number;
  date: string | null;
  center: LatLng;
  setSports: (sports: SportId[]) => void;
  setRadius: (radius: number) => void;
  setDate: (date: string | null) => void;
  setCenter: (center: LatLng) => void;
  resetFilters: () => void;
}

const DEFAULT_CENTER: LatLng = { lat: 23.7937, lng: 90.4066 };

export const useFilterStore = create<FilterState>((set) => ({
  sports: [],
  radius: 5,
  date: null,
  center: DEFAULT_CENTER,
  setSports: (sports) => set({ sports }),
  setRadius: (radius) => set({ radius }),
  setDate: (date) => set({ date }),
  setCenter: (center) => set({ center }),
  resetFilters: () => set({ sports: [], radius: 5, date: null, center: DEFAULT_CENTER }),
}));
