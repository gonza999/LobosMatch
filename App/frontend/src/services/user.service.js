import api from './api';

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),

  uploadPhoto: (formData) =>
    api.post('/users/me/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePhoto: (photoId) => api.delete(`/users/me/photos/${photoId}`),

  updateLocation: (longitude, latitude) =>
    api.put('/users/me/location', { longitude, latitude }),
  updateSettings: (settings) => api.put('/users/me/settings', settings),

  blockUser: (userId) => api.post(`/users/block/${userId}`),
  reportUser: (data) => api.post('/users/report', data),
  deleteAccount: () => api.delete('/users/me', { data: { confirmation: 'ELIMINAR' } }),
};
