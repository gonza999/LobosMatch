const { Router } = require('express');
const { like, dislike, superlike, getMatches, unmatch } = require('../controllers/match.controller');
const auth = require('../middleware/auth.middleware');
const { likesLimiter } = require('../middleware/rateLimiter.middleware');

const router = Router();

router.use(auth);

router.post('/like/:userId', likesLimiter, like);
router.post('/dislike/:userId', likesLimiter, dislike);
router.post('/superlike/:userId', likesLimiter, superlike);
router.get('/', getMatches);
router.delete('/:matchId', unmatch);

module.exports = router;
