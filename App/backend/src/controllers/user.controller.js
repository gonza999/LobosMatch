const userService = require('../services/user.service');

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/me
const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/photos
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }
    const user = await userService.uploadPhoto(req.user._id, req.file);
    res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me/photos/:photoId
const deletePhoto = async (req, res, next) => {
  try {
    const user = await userService.deletePhoto(req.user._id, req.params.photoId);
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/me/location
const updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;
    const user = await userService.updateLocation(req.user._id, longitude, latitude);
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/me/settings
const updateSettings = async (req, res, next) => {
  try {
    const user = await userService.updateSettings(req.user._id, req.body);
    res.json({ user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/block/:userId
const blockUser = async (req, res, next) => {
  try {
    const result = await userService.blockUser(req.user._id.toString(), req.params.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/users/report
const reportUser = async (req, res, next) => {
  try {
    const result = await userService.reportUser(req.user._id.toString(), req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me
const deleteAccount = async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user._id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  uploadPhoto,
  deletePhoto,
  updateLocation,
  updateSettings,
  blockUser,
  reportUser,
  deleteAccount,
};
