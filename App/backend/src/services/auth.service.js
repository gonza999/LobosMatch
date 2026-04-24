const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const generateTokens = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// SHA-256 digest para reducir el JWT a <72 bytes antes de bcrypt
const sha256 = (token) => crypto.createHash('sha256').update(token).digest('hex');

const hashRefreshToken = async (token) => {
  return bcrypt.hash(sha256(token), 10);
};

const compareRefreshToken = async (token, hash) => {
  return bcrypt.compare(sha256(token), hash);
};

module.exports = {
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
};
