const rateLimit = require('express-rate-limit');

const skipInNonProd = () => process.env.NODE_ENV !== 'production';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
  skip: skipInNonProd,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta IP.' },
  skip: skipInNonProd,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas subidas. Intenta más tarde.' },
  skip: skipInNonProd,
});

const likesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas acciones. Espera un momento.' },
  skip: skipInNonProd,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  uploadLimiter,
  likesLimiter,
};
