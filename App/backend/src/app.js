const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { AppError, ValidationError } = require('./utils/errors');

const app = express();

// 1. Helmet — Security headers
app.use(helmet());

// 2. CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:8081',
  'http://localhost:19006',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Body parser
app.use(express.json({ limit: '10mb' }));

// 4. Cookie parser
app.use(cookieParser());

// 5. Logging (solo en desarrollo)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 6. Rate limiter global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos' },
  skip: () => process.env.NODE_ENV === 'test',
});
app.use('/api', globalLimiter);

// ─── Routes ────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// User routes
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

// Explore routes
const exploreRoutes = require('./routes/explore.routes');
app.use('/api/explore', exploreRoutes);

// Match routes
const matchRoutes = require('./routes/match.routes');
app.use('/api/matches', matchRoutes);

// Message routes
const messageRoutes = require('./routes/message.routes');
app.use('/api/messages', messageRoutes);

// ─── Error Handling ────────────────────────────────────

// 404 — Ruta no encontrada
app.use((req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// Error handler global
app.use((err, req, res, next) => {
  // Errores de validación con detalles
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Errores operacionales (controlados)
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Errores de Mongoose — CastError (ObjectId inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Errores de Mongoose — Duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `El ${field} ya está registrado` });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  // Error no controlado
  console.error('ERROR no controlado:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Error interno del servidor',
  });
});

module.exports = app;
