const { Router } = require('express');
const {
  getMe,
  updateMe,
  uploadPhoto,
  deletePhoto,
  updateLocation,
  updateSettings,
  blockUser,
  reportUser,
  deleteAccount,
} = require('../controllers/user.controller');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');
const {
  updateProfileSchema,
  updateLocationSchema,
  updateSettingsSchema,
  reportSchema,
  deleteAccountSchema,
} = require('../validators/user.validator');

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Perfil
router.get('/me', getMe);
router.put('/me', validate(updateProfileSchema), updateMe);

// Fotos
router.post('/me/photos', uploadLimiter, upload.single('photo'), uploadPhoto);
router.delete('/me/photos/:photoId', deletePhoto);

// Ubicación y settings
router.put('/me/location', validate(updateLocationSchema), updateLocation);
router.put('/me/settings', validate(updateSettingsSchema), updateSettings);

// Bloqueo y reporte
router.post('/block/:userId', blockUser);
router.post('/report', validate(reportSchema), reportUser);

// Eliminación de cuenta
router.delete('/me', validate(deleteAccountSchema), deleteAccount);

module.exports = router;
