const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatService = require('../services/chat.service');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Usuario no encontrado o inactivo'));
      }

      socket.userId = user._id.toString();
      socket.user = { _id: user._id, name: user.name };
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    // Unir al usuario a su sala personal (para recibir notificaciones)
    socket.join(socket.userId);

    // ─── Unirse a sala de match ────────────────────
    socket.on('joinMatch', (matchId) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('leaveMatch', (matchId) => {
      socket.leave(`match:${matchId}`);
    });

    // ─── Enviar mensaje ────────────────────────────
    socket.on('sendMessage', async ({ matchId, text }, callback) => {
      try {
        const message = await chatService.createMessage(matchId, socket.userId, text);
        const populated = await message.populate('sender', 'name photos');

        // Emitir a todos en la sala del match (excepto el sender)
        socket.to(`match:${matchId}`).emit('newMessage', {
          matchId,
          message: populated,
        });

        // Confirmar al sender
        if (typeof callback === 'function') {
          callback({ success: true, message: populated });
        }
      } catch (error) {
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    // ─── Typing indicators ─────────────────────────
    socket.on('typing', ({ matchId }) => {
      socket.to(`match:${matchId}`).emit('userTyping', {
        matchId,
        userId: socket.userId,
        userName: socket.user.name,
      });
    });

    socket.on('stopTyping', ({ matchId }) => {
      socket.to(`match:${matchId}`).emit('userStoppedTyping', {
        matchId,
        userId: socket.userId,
      });
    });

    // ─── Marcar como leído ─────────────────────────
    socket.on('markRead', async ({ matchId }, callback) => {
      try {
        const result = await chatService.markAsRead(matchId, socket.userId);

        socket.to(`match:${matchId}`).emit('messagesRead', {
          matchId,
          userId: socket.userId,
        });

        if (typeof callback === 'function') {
          callback({ success: true, ...result });
        }
      } catch (error) {
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    // ─── Desconexión ───────────────────────────────
    socket.on('disconnect', () => {
      // Cleanup si es necesario
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io no inicializado');
  return io;
};

// Emitir evento de nuevo match a ambos usuarios
const emitNewMatch = (match) => {
  if (!io) return;
  for (const user of match.users) {
    const userId = user._id ? user._id.toString() : user.toString();
    io.to(userId).emit('newMatch', { match });
  }
};

module.exports = { initSocket, getIO, emitNewMatch };
