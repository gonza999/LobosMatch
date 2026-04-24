import { create } from 'zustand';
import { matchService } from '../services/match.service';
import { extractApiError } from '../utils/helpers';

const useMatchStore = create((set, get) => ({
  feed: [],
  matches: [],
  isLoadingFeed: false,
  isLoadingMatches: false,
  feedPage: 1,
  hasMoreFeed: true,
  showMatchOverlay: null, // { match, user } when a new match happens
  error: null,

  fetchFeed: async (reset = false) => {
    const state = get();
    if (state.isLoadingFeed) return;
    const page = reset ? 1 : state.feedPage;

    set({ isLoadingFeed: true });
    try {
      const { data } = await matchService.getExplore(page, 10);
      set({
        feed: reset ? data.profiles : [...state.feed, ...data.profiles],
        feedPage: page + 1,
        hasMoreFeed: data.profiles.length === 10,
        isLoadingFeed: false,
      });
    } catch (error) {
      set({ error: extractApiError(error), isLoadingFeed: false });
    }
  },

  like: async (userId) => {
    try {
      const { data } = await matchService.like(userId);
      set((s) => ({ feed: s.feed.filter((p) => p._id !== userId) }));
      if (data.matched) {
        const matchedUser = data.match.users.find((u) => u._id !== userId) || data.match.users[0];
        set({ showMatchOverlay: { match: data.match, user: matchedUser } });
      }
      return data;
    } catch (error) {
      set({ error: extractApiError(error) });
      throw error;
    }
  },

  dislike: async (userId) => {
    try {
      await matchService.dislike(userId);
      set((s) => ({ feed: s.feed.filter((p) => p._id !== userId) }));
    } catch (error) {
      set({ error: extractApiError(error) });
    }
  },

  superlike: async (userId) => {
    try {
      const { data } = await matchService.superlike(userId);
      set((s) => ({ feed: s.feed.filter((p) => p._id !== userId) }));
      if (data.matched) {
        const matchedUser = data.match.users.find((u) => u._id !== userId) || data.match.users[0];
        set({ showMatchOverlay: { match: data.match, user: matchedUser } });
      }
      return data;
    } catch (error) {
      set({ error: extractApiError(error) });
      throw error;
    }
  },

  dismissMatchOverlay: () => set({ showMatchOverlay: null }),

  fetchMatches: async () => {
    set({ isLoadingMatches: true });
    try {
      const { data } = await matchService.getMatches();
      set({ matches: data.matches, isLoadingMatches: false });
    } catch (error) {
      set({ error: extractApiError(error), isLoadingMatches: false });
    }
  },

  unmatch: async (matchId) => {
    try {
      await matchService.unmatch(matchId);
      set((s) => ({ matches: s.matches.filter((m) => m._id !== matchId) }));
    } catch (error) {
      set({ error: extractApiError(error) });
    }
  },

  addMatch: (match) => set((s) => ({ matches: [match, ...s.matches] })),
  clearError: () => set({ error: null }),
}));

export default useMatchStore;
