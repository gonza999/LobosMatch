const Message = require('../models/Message');
const Match = require('../models/Match');
const { NotFoundError, ForbiddenError, AppError } = require('../utils/errors');

const verifyMatchParticipant = async (matchId, userId) => {
  const match = await Match.findById(matchId);
  if (!match) throw new NotFoundError('Match no encontrado');
  if (!match.isActive) throw new ForbiddenError('Este match ya no está activo');

  const isParticipant = match.users.some((u) => u.toString() === userId);
  if (!isParticipant) throw new ForbiddenError('No eres parte de este match');

  return match;
};

const getMessages = async (matchId, userId, { page = 1, limit = 30 } = {}) => {
  await verifyMatchParticipant(matchId, userId);

  const messages = await Message.find({ match: matchId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name photos');

  // Devolver en orden cronológico (el query trae desc para paginación)
  return messages.reverse();
};

const createMessage = async (matchId, senderId, text) => {
  const match = await verifyMatchParticipant(matchId, senderId);

  if (!text || !text.trim()) {
    throw new AppError('El mensaje no puede estar vacío', 400);
  }

  const message = await Message.create({
    match: matchId,
    sender: senderId,
    text: text.trim(),
    readBy: [senderId],
  });

  // Actualizar lastMessage en el match
  match.lastMessage = {
    text: text.trim().substring(0, 100),
    sender: senderId,
    createdAt: message.createdAt,
  };
  await match.save();

  return message.populate('sender', 'name photos');
};

const markAsRead = async (matchId, userId) => {
  await verifyMatchParticipant(matchId, userId);

  const result = await Message.updateMany(
    {
      match: matchId,
      sender: { $ne: userId },
      readBy: { $nin: [userId] },
    },
    { $addToSet: { readBy: userId } }
  );

  return { markedCount: result.modifiedCount };
};

const getUnreadCount = async (matchId, userId) => {
  await verifyMatchParticipant(matchId, userId);

  const count = await Message.countDocuments({
    match: matchId,
    sender: { $ne: userId },
    readBy: { $nin: [userId] },
  });

  return count;
};

module.exports = {
  getMessages,
  createMessage,
  markAsRead,
  getUnreadCount,
};
