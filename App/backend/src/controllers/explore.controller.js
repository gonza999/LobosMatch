const exploreService = require('../services/explore.service');

// GET /api/explore
const getExplore = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const profiles = await exploreService.getExploreProfiles(req.user._id.toString(), { page, limit });
    res.json({ profiles, page, limit });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExplore };
