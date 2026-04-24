const User = require('../models/User');
const {
  generateTokens,
  verifyRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
} = require('../services/auth.service');
const { UnauthorizedError, ConflictError } = require('../utils/errors');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, birthDate, gender, genderPreference } = req.body;

    // Verificar edad mínima (18 años)
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(400).json({
        error: 'Error de validación',
        details: [{ field: 'birthDate', message: 'Debes ser mayor de 18 años' }],
      });
    }

    // Verificar email duplicado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('El email ya está registrado');
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      birthDate,
      gender,
      genderPreference,
    });

    // Generar tokens
    const tokens = generateTokens(user._id);

    // Guardar refresh token hasheado
    const hashedRefresh = await hashRefreshToken(tokens.refreshToken);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    res.status(201).json({
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario con password (select: false por defecto)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar que la cuenta esté activa
    if (!user.isActive) {
      throw new UnauthorizedError('Cuenta desactivada');
    }

    // Comparar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar tokens
    const tokens = generateTokens(user._id);

    // Guardar refresh token hasheado
    const hashedRefresh = await hashRefreshToken(tokens.refreshToken);
    await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh, lastActive: new Date() });

    res.json({
      user: user.toJSON(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verificar el refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    // Buscar usuario con su refresh token hasheado
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || !user.refreshToken) {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    // Comparar refresh token
    const isValid = await compareRefreshToken(refreshToken, user.refreshToken);
    if (!isValid) {
      // Posible robo de token: invalidar todos los refresh tokens
      await User.findByIdAndUpdate(user._id, { refreshToken: null });
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    // Generar nuevos tokens (rotación)
    const tokens = generateTokens(user._id);

    // Guardar nuevo refresh token hasheado
    const hashedRefresh = await hashRefreshToken(tokens.refreshToken);
    await User.updateOne(
      { _id: user._id },
      { $set: { refreshToken: hashedRefresh } }
    );

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    // Invalidar refresh token
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
