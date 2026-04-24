const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50)
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
    }),
  bio: Joi.string().allow('').max(500)
    .messages({
      'string.max': 'La bio no puede exceder 500 caracteres',
    }),
  interests: Joi.array().items(
    Joi.string().trim().max(30)
  ).max(10)
    .messages({
      'array.max': 'Máximo 10 intereses',
    }),
  genderPreference: Joi.array().items(
    Joi.string().valid('hombre', 'mujer', 'otro')
  ).min(1)
    .messages({
      'array.min': 'Selecciona al menos una preferencia de género',
      'any.only': 'Preferencia de género inválida',
    }),
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar',
});

const updateLocationSchema = Joi.object({
  longitude: Joi.number().min(-180).max(180).required()
    .messages({
      'number.base': 'La longitud debe ser un número',
      'number.min': 'Longitud mínima: -180',
      'number.max': 'Longitud máxima: 180',
      'any.required': 'La longitud es requerida',
    }),
  latitude: Joi.number().min(-90).max(90).required()
    .messages({
      'number.base': 'La latitud debe ser un número',
      'number.min': 'Latitud mínima: -90',
      'number.max': 'Latitud máxima: 90',
      'any.required': 'La latitud es requerida',
    }),
});

const updateSettingsSchema = Joi.object({
  maxDistance: Joi.number().integer().min(1).max(50)
    .messages({
      'number.min': 'Distancia mínima: 1 km',
      'number.max': 'Distancia máxima: 50 km',
    }),
  ageRange: Joi.object({
    min: Joi.number().integer().min(18).max(99)
      .messages({
        'number.min': 'Edad mínima: 18',
        'number.max': 'Edad máxima: 99',
      }),
    max: Joi.number().integer().min(18).max(99)
      .messages({
        'number.min': 'Edad mínima: 18',
        'number.max': 'Edad máxima: 99',
      }),
  }).custom((value, helpers) => {
    if (value.min && value.max && value.min > value.max) {
      return helpers.error('any.custom', { message: 'La edad mínima no puede ser mayor que la máxima' });
    }
    return value;
  }),
  showMe: Joi.boolean(),
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar',
});

const reportSchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
    .messages({
      'string.hex': 'ID de usuario inválido',
      'string.length': 'ID de usuario inválido',
      'any.required': 'El ID del usuario es requerido',
    }),
  reason: Joi.string().valid(
    'perfil_falso', 'contenido_inapropiado', 'acoso', 'spam', 'menor_de_edad', 'otro'
  ).required()
    .messages({
      'any.only': 'Motivo de reporte inválido',
      'any.required': 'El motivo del reporte es requerido',
    }),
  description: Joi.string().max(500).allow('')
    .messages({
      'string.max': 'La descripción no puede exceder 500 caracteres',
    }),
});

const deleteAccountSchema = Joi.object({
  confirmation: Joi.string().valid('ELIMINAR').required()
    .messages({
      'any.only': 'Debes escribir ELIMINAR para confirmar',
      'any.required': 'La confirmación es requerida',
    }),
});

module.exports = {
  updateProfileSchema,
  updateLocationSchema,
  updateSettingsSchema,
  reportSchema,
  deleteAccountSchema,
};
