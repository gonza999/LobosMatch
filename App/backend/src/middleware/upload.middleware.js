const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { AppError } = require('../utils/errors');

const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tinderapp/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 1000, crop: 'limit', quality: 'auto' },
    ],
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FORMATS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Formato no permitido. Usa JPG, PNG o WebP.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = upload;
