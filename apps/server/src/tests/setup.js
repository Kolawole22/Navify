// Jest setup file

// Load environment variables for testing
// First try to load .env.test, fall back to regular .env
try {
  require('dotenv').config({ path: '.env.test' });
} catch (error) {
  console.log('No .env.test file found, using default .env');
  require('dotenv').config();
}

// Set timeout for all tests
jest.setTimeout(10000);

// Global teardown
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});
