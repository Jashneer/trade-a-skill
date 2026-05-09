const uploadToCloudinary = require('../lib/cloudinaryUpload');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

/**
 * Upload Profile Image
 * POST /api/upload/profile-image
 *
 * Accepts a single file via Multer (field: 'profileImage'),
 * uploads the buffer to Cloudinary via cloudinaryUpload helper,
 * updates the User's profileImage field, and returns the URL.
 */
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please select an image to upload.',
      });
    }

    // Upload the file buffer to Cloudinary
    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'trade-a-skill/profiles'
    );

    // Update the user's profileImage in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully.',
      data: {
        imageUrl: imageUrl,
        user: updatedUser.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Skill Image
 * POST /api/upload/skill-image
 *
 * Generic image upload for skill thumbnails.
 * Uploads the buffer to Cloudinary and returns the URL
 * without updating any model (the caller uses the URL as needed).
 */
const uploadSkillImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please select an image to upload.',
      });
    }

    // Upload the file buffer to Cloudinary
    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'trade-a-skill/skills'
    );

    res.status(200).json({
      success: true,
      message: 'Skill image uploaded successfully.',
      data: {
        imageUrl: imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Image from Cloudinary
 * DELETE /api/upload/image
 *
 * Accepts a Cloudinary public_id in the request body
 * and removes the image from cloud storage.
 */
const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'publicId is required to delete an image.',
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully.',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted.',
        cloudinaryResult: result.result,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProfileImage,
  uploadSkillImage,
  deleteImage,
};
