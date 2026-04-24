import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { saveTokens, clearTokens, getToken } from '../services/api';
import { extractApiError } from '../utils/helpers';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ error: null, isLoading: true });
    try {
      const { data } = await authService.login({ email, password });
      await saveTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = extractApiError(error);
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  register: async (formData) => {
    set({ error: null, isLoading: true });
    try {
      const { data } = await authService.register(formData);
      await saveTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data;
    } catch (error) {
      const msg = extractApiError(error);
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore — still clear local state
    }
    await clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  loadStoredAuth: async () => {
    try {
      const token = await getToken('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      // Try to get profile with stored token
      const api = (await import('../services/api')).default;
      const { data } = await api.get('/users/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
