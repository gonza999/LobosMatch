const Like = require('../models/Like');
const Match = require('../models/Match');
const User = require('../models/User');
const { AppError, NotFoundError, ConflictError } = require('../utils/errors');
const { emitNewMatch } = require('../config/socket');

const processLike = async (fromUserId, toUserId) => {
  if (fromUserId === toUserId) {
    throw new AppError('No puedes darte like a ti mismo', 400);
  }

  const targetUser = await User.findById(toUserId);
  if (!targetUser) throw new NotFoundError('Usuario no encontrado');

  // Verificar que no exista ya un like/dislike
  const existing = await Like.findOne({ fromUser: fromUserId, toUser: toUserId });
  if (existing) throw new ConflictError('Ya evaluaste a este usuario');

  // Crear el like
  await Like.create({ fromUser: fromUserId, toUser: toUserId, type: 'like' });

  // Verificar match mutuo
  const inverseLike = await Like.findOne({
    fromUser: toUserId,
    toUser: fromUserId,
    type: { $in: ['like', 'superlike'] },
  });

  if (inverseLike) {
    // Ordenar IDs para evitar duplicados de match
    const users = [fromUserId, toUserId].sort();
    const match = await Match.create({ users });
    const populated = await Match.findById(match._id).populate('users', 'name photos');

    // Emitir evento de nuevo match via Socket.io
    emitNewMatch(populated);

    return { matched: true, match: populated };
  }

  return { matched: false };
};

const processDislike = async (fromUserId, toUserId) => {
  if (fromUserId === toUserId) {
    throw new AppError('No puedes darte dislike a ti mismo', 400);
  }

  const targetUser = await User.findById(toUserId);
  if (!targetUser) throw new NotFoundError('Usuario no encontrado');

  const existing = await Like.findOne({ fromUser: fromUserId, toUser: toUserId });
  if (existing) throw new ConflictError('Ya evaluaste a este usuario');

  await Like.create({ fromUser: fromUserId, toUser: toUserId, type: 'dislike' });

  return { message: 'Dislike registrado' };
};

const processSuperlike = async (fromUserId, toUserId) => {
  if (fromUserId === toUserId) {
    throw new AppError('No puedes darte superlike a ti mismo', 400);
  }

  const targetUser = await User.findById(toUserId);
  if (!targetUser) throw new NotFoundError('Usuario no encontrado');

  const existing = await Like.findOne({ fromUser: fromUserId, toUser: toUserId });
  if (existing) throw new ConflictError('Ya evaluaste a este usuario');

  // Límite de 1 superlike por día
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const superlikeToday = await Like.findOne({
    fromUser: fromUserId,
    type: 'superlike',
    createdAt: { $gte: todayStart },
  });

  if (superlikeToday) {
    throw new AppError('Ya usaste tu superlike del día', 429);
  }

  await Like.create({ fromUser: fromUserId, toUser: toUserId, type: 'superlike' });

  // Verificar match mutuo
  const inverseLike = await Like.findOne({
    fromUser: toUserId,
    toUser: fromUserId,
    type: { $in: ['like', 'superlike'] },
  });

  if (inverseLike) {
    const users = [fromUserId, toUserId].sort();
    const match = await Match.create({ users });
    const populated = await Match.findById(match._id).populate('users', 'name photos');

    emitNewMatch(populated);

    return { matched: true, match: populated };
  }

  return { matched: false };
};

const getMatches = async (userId) => {
  const matches = await Match.find({
    users: userId,
    isActive: true,
  })
    .populate('users', 'name photos lastActive')
    .sort({ updatedAt: -1 });

  // Filtrar para devolver solo el "otro" usuario
  return matches.map((match) => {
    const otherUser = match.users.find((u) => u._id.toString() !== userId);
    return {
      _id: match._id,
      user: otherUser ? otherUser.toJSON() : null,
      lastMessage: match.lastMessage,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  });
};

const unmatch = async (userId, matchId) => {
  const match = await Match.findById(matchId);
  if (!match) throw new NotFoundError('Match no encontrado');

  // Verificar que el usuario sea parte del match
  const isParticipant = match.users.some((u) => u.toString() === userId);
  if (!isParticipant) {
    throw new AppError('No eres parte de este match', 403);
  }

  match.isActive = false;
  await match.save();

  return { message: 'Match deshecho correctamente' };
};

module.exports = {
  processLike,
  processDislike,
  processSuperlike,
  getMatches,
  unmatch,
};
