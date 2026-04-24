const matchService = require('../services/match.service');

// POST /api/matches/like/:userId
const like = async (req, res, next) => {
  try {
    const result = await matchService.processLike(req.user._id.toString(), req.params.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/matches/dislike/:userId
const dislike = async (req, res, next) => {
  try {
    const result = await matchService.processDislike(req.user._id.toString(), req.params.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/matches/superlike/:userId
const superlike = async (req, res, next) => {
  try {
    const result = await matchService.processSuperlike(req.user._id.toString(), req.params.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/matches
const getMatches = async (req, res, next) => {
  try {
    const matches = await matchService.getMatches(req.user._id.toString());
    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/matches/:matchId
const unmatch = async (req, res, next) => {
  try {
    const result = await matchService.unmatch(req.user._id.toString(), req.params.matchId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { like, dislike, superlike, getMatches, unmatch };
