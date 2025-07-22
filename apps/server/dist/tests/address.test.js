"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
// Import the app directly to avoid module issues
const express_1 = __importDefault(require("express"));
const address_routes_1 = __importDefault(require("../routes/address.routes"));
// Mock the auth middleware
jest.mock('../middleware/auth.middleware', () => ({
    protect: (req, _res, next) => {
        // Add a mock user to the request
        req.user = {
            id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
            email: 'test@example.com'
        };
        next();
    }
}));
// Create a test app instance
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/addresses', address_routes_1.default);
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock authenticated user
const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000', // Test UUID
    email: 'test@example.com'
};
// Create test token
const createTestToken = () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
    return jsonwebtoken_1.default.sign({ id: mockUser.id, email: mockUser.email }, JWT_SECRET, {
        expiresIn: '1h'
    });
};
// Clean up function to remove test data
const cleanupTestData = async () => {
    try {
        await db_1.db.delete(schema_1.addresses).where((0, drizzle_orm_1.eq)(schema_1.addresses.userId, mockUser.id));
    }
    catch (error) {
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
            latitude: 6.5, // Lagos area
            longitude: 3.3, // Lagos area
            street: '123 Test Street',
            city: 'Lagos',
            houseNumber: '45',
            isSaved: true,
            label: 'Test Address'
        };
        const response = await (0, supertest_1.default)(app)
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
            latitude: 9.0, // Abuja area
            longitude: 7.5, // Abuja area
            street: '456 Test Avenue',
            city: 'Abuja',
            houseNumber: '78',
            stateCode: 'FC', // FCT/Abuja state code
            lgaCode: '01', // Specific LGA code
            isSaved: true,
            label: 'Test Address 2'
        };
        const response = await (0, supertest_1.default)(app)
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
            latitude: 200, // Invalid latitude (outside range)
            longitude: 3.3,
            street: 'Invalid Address',
            city: 'Test City',
            houseNumber: '1'
        };
        const response = await (0, supertest_1.default)(app)
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
        const response = await (0, supertest_1.default)(app)
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
        const response = await (0, supertest_1.default)(app)
            .post('/api/addresses')
            .send(addressData);
        expect(response.status).toBe(401);
    });
});
//# sourceMappingURL=address.test.js.map