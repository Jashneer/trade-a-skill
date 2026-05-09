const multer = require('multer');

// Configure Multer to use memory storage (for uploading to Cloudinary)
const storage = multer.memoryStorage();

// Allowed image MIME types
const ALLOWED_TYPES = /image\/(jpeg|png|gif|webp)/;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (ALLOWED_TYPES.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only image files (JPEG, PNG, GIF, WebP) are allowed!`), false);
    }
  },
});

/**
 * Multer error-handling middleware.
 * Catches MulterError (file too large, unexpected field, etc.)
 * and custom file-filter errors, returning clean JSON responses.
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large. Maximum size is 5MB.',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field name.',
      LIMIT_PART_COUNT: 'Too many parts in the form.',
      LIMIT_FIELD_KEY: 'Field name is too long.',
      LIMIT_FIELD_VALUE: 'Field value is too long.',
      LIMIT_FIELD_COUNT: 'Too many fields in the form.',
    };

    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Upload error: ${err.message}`,
      code: err.code,
    });
  }

  if (err && err.message && err.message.includes('Invalid file type')) {
    // Custom file-filter error
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Pass other errors to the global error handler
  next(err);
};

module.exports = { upload, handleMulterError };
