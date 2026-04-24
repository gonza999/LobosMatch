const { Router } = require('express');
const { getExplore } = require('../controllers/explore.controller');
const auth = require('../middleware/auth.middleware');

const router = Router();

router.use(auth);

router.get('/', getExplore);

module.exports = router;
