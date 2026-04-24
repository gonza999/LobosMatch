import api from './api';

export const chatService = {
  getMessages: (matchId, page = 1, limit = 30) =>
    api.get(`/messages/${matchId}`, { params: { page, limit } }),
  sendMessage: (matchId, text) => api.post(`/messages/${matchId}`, { text }),
  markAsRead: (matchId) => api.put(`/messages/${matchId}/read`),
  getUnreadCount: (matchId) => api.get(`/messages/${matchId}/unread`),
};
