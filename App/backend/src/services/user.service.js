const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { NotFoundError, AppError, ForbiddenError } = require('../utils/errors');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return user;
};

const updateProfile = async (userId, updateData) => {
  const allowedFields = ['name', 'bio', 'interests', 'genderPreference'];
  const sanitized = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitized[field] = updateData[field];
    }
  }

  const user = await User.findByIdAndUpdate(userId, sanitized, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return user;
};

const uploadPhoto = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('Usuario no encontrado');

  if (user.photos.length >= 6) {
    // Eliminar la imagen subida a Cloudinary si excede el límite
    await cloudinary.uploader.destroy(file.filename);
    throw new AppError('Máximo 6 fotos permitidas', 400);
  }

  const photo = {
    url: file.path,
    publicId: file.filename,
    order: user.photos.length,
  };

  user.photos.push(photo);
  await user.save({ validateModifiedOnly: true });
  return user;
};

const deletePhoto = async (userId, photoId) => {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('Usuario no encontrado');

  const photo = user.photos.id(photoId);
  if (!photo) throw new NotFoundError('Foto no encontrada');

  if (user.photos.length <= 1) {
    throw new AppError('No puedes eliminar tu única foto', 400);
  }

  // Eliminar de Cloudinary
  await cloudinary.uploader.destroy(photo.publicId);

  // Eliminar del array
  user.photos.pull(photoId);

  // Reordenar
  user.photos.forEach((p, i) => { p.order = i; });

  await user.save({ validateModifiedOnly: true });
  return user;
};

const updateLocation = async (userId, longitude, latitude) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    },
    { returnDocument: 'after', runValidators: true }
  );
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return user;
};

const updateSettings = async (userId, settingsData) => {
  const updateFields = {};
  if (settingsData.maxDistance !== undefined) {
    updateFields['settings.maxDistance'] = settingsData.maxDistance;
  }
  if (settingsData.ageRange) {
    if (settingsData.ageRange.min !== undefined) {
      updateFields['settings.ageRange.min'] = settingsData.ageRange.min;
    }
    if (settingsData.ageRange.max !== undefined) {
      updateFields['settings.ageRange.max'] = settingsData.ageRange.max;
    }
  }
  if (settingsData.showMe !== undefined) {
    updateFields['settings.showMe'] = settingsData.showMe;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { returnDocument: 'after', runValidators: true }
  );
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return user;
};

const blockUser = async (userId, targetUserId) => {
  if (userId === targetUserId) {
    throw new AppError('No puedes bloquearte a ti mismo', 400);
  }

  const target = await User.findById(targetUserId);
  if (!target) throw new NotFoundError('Usuario no encontrado');

  const user = await User.findById(userId);
  if (user.blockedUsers.includes(targetUserId)) {
    throw new AppError('Usuario ya bloqueado', 400);
  }

  user.blockedUsers.push(targetUserId);
  await user.save({ validateModifiedOnly: true });
  return { message: 'Usuario bloqueado correctamente' };
};

const reportUser = async (reporterId, { userId, reason, description }) => {
  if (reporterId === userId) {
    throw new AppError('No puedes reportarte a ti mismo', 400);
  }

  const target = await User.findById(userId);
  if (!target) throw new NotFoundError('Usuario reportado no encontrado');

  // En producción se guardaría en un modelo Report
  // Por ahora logueamos y retornamos éxito
  console.log(`[REPORT] User ${reporterId} reportó a ${userId}: ${reason} - ${description || 'Sin descripción'}`);

  return { message: 'Reporte enviado correctamente' };
};

const deleteAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { returnDocument: 'after' }
  );
  if (!user) throw new NotFoundError('Usuario no encontrado');

  // Eliminar fotos de Cloudinary
  for (const photo of user.photos) {
    await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
  }

  return { message: 'Cuenta eliminada correctamente' };
};

module.exports = {
  getProfile,
  updateProfile,
  uploadPhoto,
  deletePhoto,
  updateLocation,
  updateSettings,
  blockUser,
  reportUser,
  deleteAccount,
};
