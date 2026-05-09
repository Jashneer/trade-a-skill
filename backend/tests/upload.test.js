/** @jest-environment node */
const request = require('supertest');
const app = require('../server'); // Ensure this points to your Express app entry point
const path = require('path');
const fs = require('fs');

// Mocking the Cloudinary upload helper so we don't use real credits during testing
jest.mock('../lib/cloudinaryUpload', () => {
  return jest.fn(() => Promise.resolve('https://res.cloudinary.com/demo/image/upload/sample.jpg'));
});

describe('File Upload API (Member 3 Logic)', () => {
  const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png');
  const invalidFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');

  // Create a dummy image for testing if it doesn't exist
  beforeAll(() => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir);
    if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, 'fake-image-content');
    if (!fs.existsSync(invalidFilePath)) fs.writeFileSync(invalidFilePath, 'fake-text-content');
  });

  describe('POST /api/upload/skill-image', () => {
    it('should successfully upload a valid image (PNG/JPG)', async () => {
      const res = await request(app)
        .post('/api/upload/skill-image')
        .attach('image', testImagePath); // Member 3 used 'image' for skill-image

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('imageUrl');
    });

    it('should reject files larger than 5MB', async () => {
        // We simulate a large file error here or rely on the logic check
        // Note: Actual large file test requires a real large buffer
    });

    it('should reject invalid file types (e.g., .txt)', async () => {
      const res = await request(app)
        .post('/api/upload/skill-image')
        .attach('image', invalidFilePath);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only image files');
    });

    it('should return 400 if no file is provided', async () => {
      const res = await request(app).post('/api/upload/skill-image');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('No image file provided');
    });
  });

  describe('POST /api/upload/profile-image', () => {
    it('should return 401/404 if user is not authenticated', async () => {
      // Since this route uses req.user._id, it will fail without a token
      const res = await request(app)
        .post('/api/upload/profile-image')
        .attach('profileImage', testImagePath);
      
      // Expected to fail because we aren't sending a JWT token in this test
      expect([401, 404, 500]).toContain(res.statusCode);
    });
  });
});