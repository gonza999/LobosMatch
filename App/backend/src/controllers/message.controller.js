const chatService = require('../services/chat.service');

// GET /api/messages/:matchId
const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const messages = await chatService.getMessages(
      req.params.matchId,
      req.user._id.toString(),
      { page, limit }
    );
    res.json({ messages, page, limit });
  } catch (error) {
    next(error);
  }
};

// POST /api/messages/:matchId
const sendMessage = async (req, res, next) => {
  try {
    const message = await chatService.createMessage(
      req.params.matchId,
      req.user._id.toString(),
      req.body.text
    );
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

// PUT /api/messages/:matchId/read
const markAsRead = async (req, res, next) => {
  try {
    const result = await chatService.markAsRead(
      req.params.matchId,
      req.user._id.toString()
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/:matchId/unread
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await chatService.getUnreadCount(
      req.params.matchId,
      req.user._id.toString()
    );
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, sendMessage, markAsRead, getUnreadCount };
