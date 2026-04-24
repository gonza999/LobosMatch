import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import { getToken } from './api';

const SOCKET_URL = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:5000',
      default: 'http://localhost:5000',
    })
  : 'https://lobosmatch.onrender.com';

let socket = null;

export const socketService = {
  async connect() {
    if (socket?.connected) return socket;

    const token = await getToken('accessToken');
    if (!token) return null;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  joinMatch(matchId) {
    socket?.emit('joinMatch', matchId);
  },

  leaveMatch(matchId) {
    socket?.emit('leaveMatch', matchId);
  },

  sendMessage(matchId, text, callback) {
    socket?.emit('sendMessage', { matchId, text }, callback);
  },

  typing(matchId) {
    socket?.emit('typing', { matchId });
  },

  stopTyping(matchId) {
    socket?.emit('stopTyping', { matchId });
  },

  markRead(matchId, callback) {
    socket?.emit('markRead', { matchId }, callback);
  },

  on(event, handler) {
    socket?.on(event, handler);
  },

  off(event, handler) {
    socket?.off(event, handler);
  },
};
