const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'El nombre es requerido',
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
      'any.required': 'El nombre es requerido',
    }),
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Email no válido',
      'string.empty': 'El email es requerido',
      'any.required': 'El email es requerido',
    }),
  password: Joi.string().min(6).pattern(/\d/).required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos un número',
      'string.empty': 'La contraseña es requerida',
      'any.required': 'La contraseña es requerida',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'any.only': 'Las contraseñas no coinciden',
      'string.empty': 'Confirmar contraseña es requerido',
      'any.required': 'Confirmar contraseña es requerido',
    }),
  birthDate: Joi.date().max('now').required()
    .messages({
      'date.max': 'La fecha de nacimiento no puede ser futura',
      'any.required': 'La fecha de nacimiento es requerida',
    }),
  gender: Joi.string().valid('hombre', 'mujer', 'otro').required()
    .messages({
      'any.only': 'Género debe ser hombre, mujer u otro',
      'any.required': 'El género es requerido',
    }),
  genderPreference: Joi.array()
    .items(Joi.string().valid('hombre', 'mujer', 'otro'))
    .min(1)
    .required()
    .messages({
      'array.min': 'Debes seleccionar al menos una preferencia de género',
      'any.required': 'La preferencia de género es requerida',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Email no válido',
      'string.empty': 'El email es requerido',
      'any.required': 'El email es requerido',
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'La contraseña es requerida',
      'any.required': 'La contraseña es requerida',
    }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
    .messages({
      'string.empty': 'El refresh token es requerido',
      'any.required': 'El refresh token es requerido',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};
