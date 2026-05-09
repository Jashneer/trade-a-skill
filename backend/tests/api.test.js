const request = require('supertest');
const express = require('express');
const app = require('../server'); // Adjust path if needed

describe('API Tests', () => {
  it('should respond to GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Add more tests for routes
});