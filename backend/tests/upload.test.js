/** @jest-environment node */
const request = require('supertest');
const app = require('../server');

describe('Member 3: SSR Form Check', () => {
  it('should have a working /upload page for the SSR form', async () => {
    const res = await request(app).get('/upload');
    // We accept 200 (Success) or 302 (Redirect to Login)
    expect([200, 302, 401]).toContain(res.statusCode);
  });
});

// We are skipping the POST tests for now because they require 
// active Cloudinary credentials and specific Auth tokens.