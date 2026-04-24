import { create } from 'zustand';
import { userService } from '../services/user.service';
import { extractApiError } from '../utils/helpers';

const useUserStore = create((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await userService.getProfile();
      set({ profile: data.user, isLoading: false });
      return data.user;
    } catch (error) {
      set({ error: extractApiError(error), isLoading: false });
      throw error;
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true });
    try {
      const { data } = await userService.updateProfile(updates);
      set({ profile: data.user, isLoading: false });
      return data.user;
    } catch (error) {
      set({ error: extractApiError(error), isLoading: false });
      throw error;
    }
  },

  uploadPhoto: async (formData) => {
    try {
      const { data } = await userService.uploadPhoto(formData);
      set({ profile: data.user });
      return data.user;
    } catch (error) {
      set({ error: extractApiError(error) });
      throw error;
    }
  },

  deletePhoto: async (photoId) => {
    try {
      const { data } = await userService.deletePhoto(photoId);
      set({ profile: data.user });
      return data.user;
    } catch (error) {
      set({ error: extractApiError(error) });
      throw error;
    }
  },

  updateLocation: async (longitude, latitude) => {
    try {
      const { data } = await userService.updateLocation(longitude, latitude);
      set({ profile: data.user });
    } catch (error) {
      set({ error: extractApiError(error) });
    }
  },

  updateSettings: async (settings) => {
    try {
      const { data } = await userService.updateSettings(settings);
      set({ profile: data.user });
      return data.user;
    } catch (error) {
      set({ error: extractApiError(error) });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useUserStore;
