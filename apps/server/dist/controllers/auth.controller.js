"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = exports.verifyOtp = exports.requestOtp = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const addressing_1 = require("../utils/addressing"); // Import HHG generator
// TODO: Move OTP storage logic (e.g., to memory cache, Redis, or DB)
const otpStore = {};
const OTP_EXPIRY_MINUTES = 5;
// --- Helper Functions ---
// Function to generate JWT
const generateToken = (userId, email) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    // Use numeric seconds for expiresIn (e.g., 30 days)
    const expiresInSeconds = process.env.JWT_EXPIRES_IN_SECONDS
        ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10)
        : 30 * 24 * 60 * 60;
    const options = {
        expiresIn: expiresInSeconds,
        algorithm: "HS256",
    };
    return jsonwebtoken_1.default.sign({ id: userId, email: email }, JWT_SECRET, options);
};
// --- Controller Functions ---
// POST /api/auth/request-otp
const requestOtp = async (req, res) => {
    // TODO: Implement validation (e.g., Zod) for phoneNumber
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        res.status(400).json({ error: "Phone number is required" });
        return;
    }
    // Generate mock OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    // Store OTP (replace with more robust storage)
    otpStore[phoneNumber] = { otp: "123456", expiresAt };
    console.log(`OTP for ${phoneNumber}: ${mockOtp}`); // Log for debugging
    // In a real app, send OTP via SMS here
    res.status(200).json({ message: "OTP requested successfully" });
    return;
};
exports.requestOtp = requestOtp;
// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
    // TODO: Implement validation
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        res.status(400).json({ error: "Phone number and OTP are required" });
        return;
    }
    const storedOtpData = otpStore[phoneNumber];
    if (!storedOtpData) {
        res
            .status(400)
            .json({ error: "No OTP requested for this number or it has expired" });
        return;
    }
    if (Date.now() > storedOtpData.expiresAt) {
        delete otpStore[phoneNumber]; // Clean up expired OTP
        res.status(400).json({ error: "OTP has expired" });
        return;
    }
    if (storedOtpData.otp !== otp) {
        res.status(400).json({ error: "Invalid OTP" });
        return;
    }
    // OTP is valid - potentially mark phone as verified in a temp way if needed
    // For now, just confirm validity and clear the OTP
    delete otpStore[phoneNumber];
    res.status(200).json({ message: "OTP verified successfully" });
    return;
};
exports.verifyOtp = verifyOtp;
// POST /api/auth/register
const register = async (req, res) => {
    console.log("--- Registration Request Body ---");
    console.log(req.body);
    console.log("---------------------------------");
    // TODO: Implement Zod validation for the entire registration payload
    // const validationResult = registerSchema.safeParse(req.body);
    // if (!validationResult.success) { ... }
    const { phoneNumber, firstName, lastName, email, password, 
    // Address fields - expect lat/lon, use them to generate code/state/lga
    latitude, longitude, street, city, houseNumber, landmark, apartment, // Maps to floor
    estate, specialDescription, photoUrls,
    // Remove state, lga from destructuring as they are derived
     } = req.body;
    // --- Basic Checks (Replace with Zod) ---
    if (!phoneNumber ||
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !street ||
        // !state || // Removed
        // !lga || // Removed
        !city ||
        !latitude ||
        !longitude) {
        res.status(400).json({ error: "Missing required registration fields" });
        return;
    }
    // TODO: Add password complexity checks
    try {
        // Check if user already exists (by email or phone)
        const existingUser = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email)); // Or eq(users.phoneNumber, phoneNumber)
        // Consider adding unique constraint on phoneNumber in schema
        if (existingUser.length > 0) {
            res
                .status(409)
                .json({ error: "User with this email or phone number already exists" });
            return;
        }
        // Hash password
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(password, salt);
        // --- Create User and Address in a Transaction ---
        const result = await db_1.db.transaction(async (tx) => {
            // Create user
            const newUserResult = await tx
                .insert(schema_1.users)
                .values({
                email,
                phoneNumber,
                firstName,
                lastName,
                passwordHash,
                // isVerified: true, // Mark as verified since OTP was checked prior?
            })
                .returning({
                id: schema_1.users.id,
                email: schema_1.users.email,
                firstName: schema_1.users.firstName,
            });
            const newUser = newUserResult[0];
            if (!newUser)
                throw new Error("Failed to create user record");
            // --- Generate and parse HHG code for address ---
            const hhgCode = await (0, addressing_1.generateHhgCode)(latitude, longitude);
            if (!hhgCode) {
                // If code generation fails (e.g., invalid coords), throw to rollback transaction
                throw new Error("Could not generate address code for the provided coordinates.");
            }
            const codeParts = hhgCode.split("-");
            if (codeParts.length !== 4) {
                throw new Error("Internal error parsing generated address components.");
            }
            const stateCode = codeParts[1];
            const lgaCode = codeParts[2];
            // --- End HHG code generation ---
            // Create address (linked to user) using correct schema
            const newAddressResult = await tx
                .insert(schema_1.addresses)
                .values({
                userId: newUser.id,
                street,
                // Remove: state, lga, uniqueCode
                // state: state,
                // lga: lga,
                city,
                houseNumber,
                landmark,
                floor: apartment, // Map apartment to floor field
                estate,
                specialDescription,
                photoUrls,
                latitude: latitude.toString(), // Convert to string for decimal
                longitude: longitude.toString(),
                // Add: hhgCode, stateCode, lgaCode
                hhgCode: hhgCode,
                stateCode: stateCode,
                lgaCode: lgaCode,
                // uniqueCode: "TBD", // Removed
                isSaved: true, // Assume primary address is saved
                label: "Primary", // Default label?
            })
                .returning();
            if (newAddressResult.length === 0)
                throw new Error("Failed to create address record");
            return newUser; // Return the created user data
        });
        // Generate JWT
        const token = generateToken(result.id, result.email);
        // Respond with user data (excluding password) and token
        res.status(201).json({
            user: {
                id: result.id,
                email: result.email,
                firstName: result.firstName,
                // Include other needed fields
            },
            token,
        });
        return;
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error instanceof Error &&
            error.message.startsWith("Could not generate")) {
            res.status(400).json({ error: error.message }); // Bad coords error
        }
        else if (error instanceof Error &&
            error.message.startsWith("Internal error parsing")) {
            res.status(500).json({ error: error.message }); // HHG parsing error
        }
        else {
            res.status(500).json({ error: "Registration failed" });
        }
        return;
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    // TODO: Implement Zod validation
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
    }
    try {
        // Find user by email
        const userResult = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            res.status(401).json({ error: "Invalid credentials" }); // User not found
            return;
        }
        // Check password
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials" }); // Password incorrect
            return;
        }
        // TODO: Check if user is verified if applicable
        // if (!user.isVerified) { ... }
        // Generate JWT
        const token = generateToken(user.id, user.email);
        // Respond with user data (excluding password) and token
        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                // include other necessary fields
            },
            token,
        });
        return;
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
        return;
    }
};
exports.login = login;
// GET /api/auth/me (Protected)
const getCurrentUser = async (req, res) => {
    // User should be attached by the 'protect' middleware
    if (!req.user) {
        // This should technically not happen if protect middleware is working
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        // Fetch full, up-to-date user details from DB using the ID from the token
        const userResult = await db_1.db
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            phoneNumber: schema_1.users.phoneNumber,
            createdAt: schema_1.users.createdAt,
            // isVerified: users.isVerified,
            // Add other fields as needed
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.id))
            .limit(1);
        const currentUser = userResult[0];
        if (!currentUser) {
            // User existed when token was issued, but not anymore?
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user: currentUser });
        return;
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ error: "Failed to fetch user data" });
        return;
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.controller.js.map