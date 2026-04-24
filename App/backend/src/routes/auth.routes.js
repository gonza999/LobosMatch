const { Router } = require('express');
const { register, login, refresh, logout } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.validator');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter.middleware');

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', auth, logout);

module.exports = router;
