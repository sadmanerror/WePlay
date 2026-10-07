'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, RegisterInput } from '../types';
import * as userService from '../services/users';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { user, token } = await userService.login(email, password);
        set({ user, token, isAuthenticated: true });
      },
      register: async (input) => {
        const { user, token } = await userService.register(input);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('weplay_token');
          localStorage.removeItem('weplay_user_matches');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser = await userService.updateProfile(currentUser.id, updates);
        set({ user: updatedUser });
      },
    }),
    {
      name: 'weplay-auth-storage',
    }
  )
);
