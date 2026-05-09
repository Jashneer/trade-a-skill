require('dotenv').config();
const pg = require('pg');

describe('Database Connection Test', () => {
  let client;

  beforeAll(async () => {
    client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });

  test('should connect to PostgreSQL database and run a simple query', async () => {
    try {
      // Test the connection
      const result = await client.query('SELECT NOW()');
      console.log('✅ Successfully connected to PostgreSQL');
      console.log('Current timestamp:', result.rows[0].now);

      // If we reach here, the test passes
      expect(result.rows.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('❌ Database connection failed:');
      console.error('Error message:', error.message);
      console.error('DATABASE_URL:', process.env.DATABASE_URL);
      throw error;
    }
  });
});
