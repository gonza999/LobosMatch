const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // === AUTENTICACIÓN ===
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Email no válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false,
  },
  refreshToken: {
    type: String,
    select: false,
  },

  // === PERFIL ===
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
  },
  birthDate: {
    type: Date,
    required: [true, 'La fecha de nacimiento es requerida'],
  },
  gender: {
    type: String,
    required: [true, 'El género es requerido'],
    enum: {
      values: ['hombre', 'mujer', 'otro'],
      message: 'Género debe ser hombre, mujer u otro',
    },
  },
  bio: {
    type: String,
    maxlength: [500, 'La bio no puede exceder 500 caracteres'],
    default: '',
  },
  photos: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    order: { type: Number, required: true },
  }],
  interests: [{
    type: String,
    trim: true,
    maxlength: 30,
  }],

  // === PREFERENCIAS DE BÚSQUEDA ===
  genderPreference: [{
    type: String,
    enum: ['hombre', 'mujer', 'otro'],
  }],

  // === UBICACIÓN (GeoJSON) ===
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      default: [0, 0],
    },
  },

  // === CONFIGURACIÓN ===
  settings: {
    maxDistance: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
    ageRange: {
      min: { type: Number, default: 18, min: 18, max: 99 },
      max: { type: Number, default: 35, min: 18, max: 99 },
    },
    showMe: {
      type: Boolean,
      default: true,
    },
  },

  // === ESTADO ===
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// ─── Índices ───────────────────────────────────────────

userSchema.index({ location: '2dsphere' });
userSchema.index({ isActive: 1, 'settings.showMe': 1 });
userSchema.index({ lastActive: 1 });

// ─── Hooks ─────────────────────────────────────────────

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Métodos de instancia ──────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getAge = function () {
  if (!this.birthDate) return null;
  return Math.floor((Date.now() - this.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

// ─── Virtuals ──────────────────────────────────────────

userSchema.virtual('age').get(function () {
  return this.getAge();
});

// ─── toJSON ────────────────────────────────────────────

userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
