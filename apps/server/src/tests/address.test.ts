import request from 'supertest';
// Import the app directly to avoid module issues
import express from 'express';
import addressRoutes from '../routes/address.routes';

// Mock the auth middleware
jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: any, _res: any, next: any) => {
    // Add a mock user to the request
    req.user = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
      email: 'test@example.com'
    };
    next();
  }
}));

// Create a test app instance
const app = express();
app.use(express.json());
app.use('/api/addresses', addressRoutes);
import { db } from '../db';
import { addresses } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Mock authenticated user
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
  email: 'test@example.com'
};

// Create test token
const createTestToken = () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
  return jwt.sign({ id: mockUser.id, email: mockUser.email }, JWT_SECRET, {
    expiresIn: '1h'
  });
};

// Clean up function to remove test data
const cleanupTestData = async () => {
  try {
    await db.delete(addresses).where(eq(addresses.userId, mockUser.id));
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

describe('Address Controller Tests', () => {
  // Run before all tests
  beforeAll(async () => {
    // Any setup needed before all tests
    await cleanupTestData(); // Start with clean state
  });

  // Run after all tests
  afterAll(async () => {
    await cleanupTestData();
    // Close any connections if needed
  });

  // Test 1: Create address with minimal information
  it('should create an address with minimal information', async () => {
    const testToken = createTestToken();
    
    const addressData = {
      latitude: 6.5,       // Lagos area
      longitude: 3.3,      // Lagos area
      street: '123 Test Street',
      city: 'Lagos',
      houseNumber: '45',
      isSaved: true,
      label: 'Test Address'
    };
    
    const response = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${testToken}`)
      .send(addressData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('hhgCode');
    
    // Verify DDC format (NG-XX-YY-ZZZ-NNNN)
    const ddc = response.body.hhgCode;
    expect(ddc).toMatch(/^NG-[A-Z]{2}-\d{2}-(STR|Z|LMK)\d{3}-\d{4}$/);
    
    // Check individual DDC components
    expect(response.body).toHaveProperty('stateCode');
    expect(response.body).toHaveProperty('lgaCode');
    expect(response.body).toHaveProperty('areaType');
    expect(response.body).toHaveProperty('areaCode');
    expect(response.body).toHaveProperty('locationNumber');
    
    // Expected Lagos state code
    expect(response.body.stateCode).toBe('LA');
  });
  
  // Test 2: Create address with specific state and LGA codes
  it('should create an address with provided state and LGA codes', async () => {
    const testToken = createTestToken();
    
    const addressData = {
      latitude: 9.0,          // Abuja area
      longitude: 7.5,         // Abuja area
      street: '456 Test Avenue',
      city: 'Abuja',
      houseNumber: '78',
      stateCode: 'FC',        // FCT/Abuja state code
      lgaCode: '01',          // Specific LGA code
      isSaved: true,
      label: 'Test Address 2'
    };
    
    const response = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${testToken}`)
      .send(addressData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('hhgCode');
    
    // Verify DDC format with our specific state/LGA codes
    const ddc = response.body.hhgCode;
    expect(ddc).toMatch(/^NG-FC-01-(STR|Z|LMK)\d{3}-\d{4}$/);
    
    // Check that our provided codes were used
    expect(response.body.stateCode).toBe('FC');
    expect(response.body.lgaCode).toBe('01');
  });
  
  // Test 3: Error handling for invalid coordinates
  it('should return error for invalid coordinates', async () => {
    const testToken = createTestToken();
    
    const addressData = {
      latitude: 200,        // Invalid latitude (outside range)
      longitude: 3.3,
      street: 'Invalid Address',
      city: 'Test City',
      houseNumber: '1'
    };
    
    const response = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${testToken}`)
      .send(addressData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test 4: Error handling for missing required fields
  it('should return error for missing required fields', async () => {
    const testToken = createTestToken();
    
    const addressData = {
      // Missing latitude and longitude
      street: 'Incomplete Address',
      city: 'Test City'
    };
    
    const response = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${testToken}`)
      .send(addressData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test 5: Unauthorized access
  it('should deny access without authentication', async () => {
    const addressData = {
      latitude: 6.5,
      longitude: 3.3,
      street: 'Test Street',
      city: 'Test City',
      houseNumber: '1'
    };
    
    const response = await request(app)
      .post('/api/addresses')
      .send(addressData);
    
    expect(response.status).toBe(401);
  });
});
