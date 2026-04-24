import { create } from 'zustand';
import { chatService } from '../services/chat.service';
import { extractApiError } from '../utils/helpers';

const useChatStore = create((set, get) => ({
  messages: {},      // { [matchId]: Message[] }
  typingUsers: {},   // { [matchId]: { userId, userName } }
  unreadCounts: {},  // { [matchId]: number }
  isLoading: false,
  error: null,

  fetchMessages: async (matchId, page = 1) => {
    set({ isLoading: true });
    try {
      const { data } = await chatService.getMessages(matchId, page);
      set((s) => {
        const existing = page > 1 ? (s.messages[matchId] || []) : [];
        // Older messages prepended when paginating, new messages at end
        const merged = page > 1
          ? [...data.messages, ...existing]
          : data.messages;
        return {
          messages: { ...s.messages, [matchId]: merged },
          isLoading: false,
        };
      });
      return data.messages;
    } catch (error) {
      set({ error: extractApiError(error), isLoading: false });
      throw error;
    }
  },

  addMessage: (matchId, message) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [matchId]: [...(s.messages[matchId] || []), message],
      },
    }));
  },

  markAsRead: async (matchId) => {
    try {
      await chatService.markAsRead(matchId);
      set((s) => ({ unreadCounts: { ...s.unreadCounts, [matchId]: 0 } }));
    } catch {
      // silent
    }
  },

  fetchUnreadCount: async (matchId) => {
    try {
      const { data } = await chatService.getUnreadCount(matchId);
      set((s) => ({
        unreadCounts: { ...s.unreadCounts, [matchId]: data.unreadCount },
      }));
    } catch {
      // silent
    }
  },

  setTyping: (matchId, userId, userName) => {
    set((s) => ({
      typingUsers: { ...s.typingUsers, [matchId]: { userId, userName } },
    }));
  },

  clearTyping: (matchId) => {
    set((s) => {
      const copy = { ...s.typingUsers };
      delete copy[matchId];
      return { typingUsers: copy };
    });
  },

  incrementUnread: (matchId) => {
    set((s) => ({
      unreadCounts: {
        ...s.unreadCounts,
        [matchId]: (s.unreadCounts[matchId] || 0) + 1,
      },
    }));
  },

  clearError: () => set({ error: null }),
}));

export default useChatStore;
