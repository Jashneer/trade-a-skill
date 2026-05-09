const express = require('express');
const authVerify = require('../middleware/authVerify');
const { upload, handleMulterError } = require('../middleware/multer');
const {
  uploadProfileImage,
  uploadSkillImage,
  deleteImage,
} = require('../controllers/uploadController');

const router = express.Router();

/**
 * POST /api/upload/profile-image
 * Upload a profile image for the authenticated user.
 * - Requires authentication (JWT or session)
 * - Accepts a single file with field name 'profileImage'
 * - Uploads to Cloudinary and updates the User model
 */
router.post(
  '/profile-image',
  authVerify,
  upload.single('profileImage'),
  handleMulterError,
  uploadProfileImage
);

/**
 * POST /api/upload/skill-image
 * Upload a skill thumbnail image.
 * - Requires authentication (JWT or session)
 * - Accepts a single file with field name 'skillImage'
 * - Uploads to Cloudinary and returns the URL
 */
router.post(
  '/skill-image',
  authVerify,
  upload.single('skillImage'),
  handleMulterError,
  uploadSkillImage
);

/**
 * DELETE /api/upload/image
 * Delete an image from Cloudinary.
 * - Requires authentication (JWT or session)
 * - Expects { publicId } in the request body
 */
router.delete(
  '/image',
  authVerify,
  deleteImage
);

module.exports = router;
