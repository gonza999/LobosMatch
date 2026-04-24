import api from './api';

export const matchService = {
  getExplore: (page = 1, limit = 10) =>
    api.get('/explore', { params: { page, limit } }),

  like: (userId) => api.post(`/matches/like/${userId}`),
  dislike: (userId) => api.post(`/matches/dislike/${userId}`),
  superlike: (userId) => api.post(`/matches/superlike/${userId}`),

  getMatches: () => api.get('/matches'),
  unmatch: (matchId) => api.delete(`/matches/${matchId}`),
};
