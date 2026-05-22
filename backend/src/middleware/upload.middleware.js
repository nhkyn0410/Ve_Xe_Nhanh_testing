const multer = require('multer');
const path = require('path');

/**
 * Upload Middleware
 * Xu ly viec upload file voi multer
 */

// Cau hinh multer storage - luu vao memory de upload len Cloudinary
const storage = multer.memoryStorage();

// File filter - chi chap nhan file anh
const fileFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error('Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF, WebP)'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

/**
 * Middleware xu ly loi upload
 */
const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File quá lớn. Kích thước tối đa là 5MB',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Quá nhiều file được upload',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Trường file không hợp lệ',
      });
    }

    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Lỗi khi upload file',
    });
  }

  next();
};

const uploadAvatar = upload.single('avatar');
const uploadImages = upload.array('images', 5);

module.exports = {
  upload,
  uploadAvatar,
  uploadImages,
  handleUploadError,
};
