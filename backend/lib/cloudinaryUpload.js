const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Uploads a file buffer to Cloudinary and returns the secure URL.
 *
 * @param {Buffer} fileBuffer - The file buffer from Multer's memoryStorage
 * @param {string} folder    - Cloudinary folder path (default: 'trade-a-skill')
 * @returns {Promise<string>} - Resolves with the Cloudinary secure_url
 */
const uploadToCloudinary = (fileBuffer, folder = 'trade-a-skill') => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('File buffer is required'));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        quality: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload error: ${error.message}`));
        } else if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error('No URL returned from Cloudinary'));
        }
      }
    );

    // Create readable stream from buffer
    const readable = Readable.from([fileBuffer]);
    readable.pipe(stream);

    // Handle stream errors
    stream.on('error', (err) => {
      reject(new Error(`Stream error: ${err.message}`));
    });
  });
};

module.exports = uploadToCloudinary;
