const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');

const auth = async (req, res, next) => {
  try {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Buscar usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    // 4. Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new UnauthorizedError('Cuenta desactivada');
    }

    // 5. Adjuntar usuario al request
    req.user = user;

    // Actualizar lastActive
    user.lastActive = new Date();
    await user.save({ validateModifiedOnly: true });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expirado'));
    }
    next(error);
  }
};

module.exports = auth;
