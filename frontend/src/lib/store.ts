import { create } from 'zustand';
import type { UserProfile, MatchResult } from '@/types';

interface VibeMatchState {
  // Auth
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;

  // User data
  profile: UserProfile | null;
  hasEmbedding: boolean;

  // Matches
  matches: MatchResult[];

  // Actions
  setAuth: (token: string, username: string) => void;
  logout: () => void;
  setProfile: (profile: UserProfile) => void;
  setHasEmbedding: (has: boolean) => void;
  setMatches: (matches: MatchResult[]) => void;
}

export const useStore = create<VibeMatchState>((set) => ({
  // Initial state
  isAuthenticated: false,
  token: null,
  username: null,
  profile: null,
  hasEmbedding: false,
  matches: [],

  // Actions
  setAuth: (token, username) => {
    localStorage.setItem('vibematch_token', token);
    localStorage.setItem('vibematch_username', username);
    set({ isAuthenticated: true, token, username });
  },

  logout: () => {
    localStorage.removeItem('vibematch_token');
    localStorage.removeItem('vibematch_username');
    set({
      isAuthenticated: false,
      token: null,
      username: null,
      profile: null,
      hasEmbedding: false,
      matches: []
    });
  },

  setProfile: (profile) => set({ profile }),
  setHasEmbedding: (has) => set({ hasEmbedding: has }),
  setMatches: (matches) => set({ matches }),
}));
