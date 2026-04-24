const User = require('../models/User');
const Like = require('../models/Like');

const getExploreProfiles = async (userId, { page = 1, limit = 10 } = {}) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  // IDs de usuarios ya evaluados (like/dislike/superlike)
  const alreadySwiped = await Like.find({ fromUser: userId }).distinct('toUser');

  // IDs bloqueados (bidireccional)
  const blockedByMe = user.blockedUsers || [];
  const blockedMe = await User.find({ blockedUsers: userId }).distinct('_id');

  const excludeIds = [
    userId,
    ...alreadySwiped.map(String),
    ...blockedByMe.map(String),
    ...blockedMe.map(String),
  ];

  // Filtros base
  const query = {
    _id: { $nin: excludeIds },
    isActive: true,
    'settings.showMe': true,
  };

  // Filtro de preferencia de género mutua
  // Yo quiero ver estos géneros Y ellos quieren ver mi género
  if (user.genderPreference && user.genderPreference.length > 0) {
    query.gender = { $in: user.genderPreference };
  }
  query.genderPreference = { $in: [user.gender] };

  // Filtro de edad
  const now = new Date();
  const ageMin = user.settings?.ageRange?.min || 18;
  const ageMax = user.settings?.ageRange?.max || 99;
  const maxBirthDate = new Date(now.getFullYear() - ageMin, now.getMonth(), now.getDate());
  const minBirthDate = new Date(now.getFullYear() - ageMax - 1, now.getMonth(), now.getDate());
  query.birthDate = { $gte: minBirthDate, $lte: maxBirthDate };

  // Filtro geoespacial (solo si el usuario tiene ubicación configurada)
  const hasLocation = user.location &&
    user.location.coordinates &&
    user.location.coordinates[0] !== 0 &&
    user.location.coordinates[1] !== 0;

  let profiles;

  if (hasLocation) {
    const maxDistanceMeters = (user.settings?.maxDistance || 10) * 1000;

    profiles = await User.find({
      ...query,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates,
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    })
      .select('name birthDate gender bio photos interests location')
      .skip((page - 1) * limit)
      .limit(limit);
  } else {
    // Sin ubicación: devolver por lastActive (más recientes primero)
    profiles = await User.find(query)
      .select('name birthDate gender bio photos interests location')
      .sort({ lastActive: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  return profiles.map((p) => p.toJSON());
};

module.exports = {
  getExploreProfiles,
};
