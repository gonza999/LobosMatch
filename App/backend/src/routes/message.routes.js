const { Router } = require('express');
const { getMessages, sendMessage, markAsRead, getUnreadCount } = require('../controllers/message.controller');
const auth = require('../middleware/auth.middleware');

const router = Router();

router.use(auth);

router.get('/:matchId', getMessages);
router.post('/:matchId', sendMessage);
router.put('/:matchId/read', markAsRead);
router.get('/:matchId/unread', getUnreadCount);

module.exports = router;
