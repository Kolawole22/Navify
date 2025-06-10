import { Request, Response } from "express";
import { db } from "../db";
import { users, addresses } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod"; // Add Zod import
// z import will be used when implementing Zod validation
import {
  generateHhgCode,
  parseDDC,
  generateEnhancedAddress,
} from "../utils/addressing"; // Import DDC generator and parser

// --- Zod Schemas ---

// OTP request schema
const otpRequestSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

// OTP verification schema
const otpVerifySchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  otp: z.string().min(1, "OTP is required"),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Registration schema with conditional validation
const registerSchema = z
  .object({
    phoneNumber: z.string().min(1, "Phone number is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),

    // Location fields
    latitude: z
      .number({
        invalid_type_error: "Latitude must be a number",
        required_error: "Latitude is required",
      })
      .min(-90)
      .max(90, "Invalid latitude"),
    longitude: z
      .number({
        invalid_type_error: "Longitude must be a number",
        required_error: "Longitude is required",
      })
      .min(-180)
      .max(180, "Invalid longitude"),
    city: z.string().min(1, "City is required"),

    // Address fields with conditional validation
    street: z.string().optional().default(""),
    houseNumber: z.string().optional().default(""),
    landmark: z.string().optional(),
    apartment: z.string().optional(),
    estate: z.string().optional(),
    specialDescription: z.string().optional(),
    category: z.string().optional(),
    photoUrls: z.array(z.string()).optional(),
    noStreetAddress: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      // If noStreetAddress is false, street is required
      if (!data.noStreetAddress && !data.street) {
        return false;
      }
      return true;
    },
    {
      message: "Street is required when no street address is not specified",
      path: ["street"],
    }
  );

// TODO: Move OTP storage logic (e.g., to memory cache, Redis, or DB)
const otpStore: { [key: string]: { otp: string; expiresAt: number } } = {};
const OTP_EXPIRY_MINUTES = 5;

// --- Helper Functions ---

// Function to generate JWT
const generateToken = (userId: string, email: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  // Use numeric seconds for expiresIn (e.g., 30 days)
  const expiresInSeconds = process.env.JWT_EXPIRES_IN_SECONDS
    ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10)
    : 30 * 24 * 60 * 60;

  const options: jwt.SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: "HS256",
  };

  return jwt.sign({ id: userId, email: email }, JWT_SECRET, options);
};

// --- Controller Functions ---

// POST /api/auth/request-otp
export const requestOtp = async (req: Request, res: Response) => {
  // Validate request body with Zod
  const validationResult = otpRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    res.status(400).json({
      error: errors[0]?.message || "Validation failed",
      details: errors,
    });
    return;
  }

  const { phoneNumber } = validationResult.data;

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

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response) => {
  // Validate request body with Zod
  const validationResult = otpVerifySchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    res.status(400).json({
      error: errors[0]?.message || "Validation failed",
      details: errors,
    });
    return;
  }

  const { phoneNumber, otp } = validationResult.data;

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

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  console.log("--- Registration Request Body ---");
  console.log(req.body);
  console.log("---------------------------------");

  // Validate request body with Zod
  const validationResult = registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    console.log("Validation errors:", errors);

    // Return first error message for simplicity (or return all errors)
    res.status(400).json({
      error: errors[0]?.message || "Validation failed",
      details: errors,
    });
    return;
  }

  // Extract validated data
  const {
    phoneNumber,
    firstName,
    lastName,
    email,
    password,
    latitude,
    longitude,
    street,
    city,
    houseNumber,
    landmark,
    apartment,
    estate,
    specialDescription,
    photoUrls,
    noStreetAddress,
    category,
  } = validationResult.data;

  // Also extract the client-provided location codes
  const clientStateCode = req.body.stateCode;
  const clientLgaCode = req.body.lgaCode;

  try {
    // Check if user already exists (by email or phone)
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email)); // Or eq(users.phoneNumber, phoneNumber)
    // Consider adding unique constraint on phoneNumber in schema

    if (existingUser.length > 0) {
      res
        .status(409)
        .json({ error: "User with this email or phone number already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // --- Create User and Address in a Transaction ---
    const result = await db.transaction(async (tx) => {
      // Create user
      const newUserResult = await tx
        .insert(users)
        .values({
          email,
          phoneNumber,
          firstName,
          lastName,
          passwordHash,
          // isVerified: true, // Mark as verified since OTP was checked prior?
        })
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
        });

      const newUser = newUserResult[0];
      if (!newUser) throw new Error("Failed to create user record");

      // --- Enhanced Address Generation (with rural support) ---
      let enhancedAddressInfo;
      let ddc: string | null = null;
      let stateCode: string = "";
      let lgaCode: string = "";
      let areaType: string = "";
      let areaCode: string = "";
      let locationNumber: string = "";

      try {
        // Create user-provided description from available fields
        let userDescription = "";
        if (landmark) userDescription += landmark;
        if (specialDescription) {
          userDescription += (userDescription ? ", " : "") + specialDescription;
        }

        // Use enhanced address generation for rural areas
        enhancedAddressInfo = await generateEnhancedAddress(
          latitude,
          longitude,
          city,
          userDescription || undefined,
          noStreetAddress // Treat no street address as potentially rural
        );

        ddc = enhancedAddressInfo.hhgCode;

        if (ddc) {
          const ddcInfo = parseDDC(ddc);
          if (ddcInfo) {
            ({ stateCode, lgaCode, areaType, areaCode, locationNumber } =
              ddcInfo);
          }
        }
      } catch (error) {
        console.warn(
          "Enhanced address generation failed, falling back to basic DDC",
          error
        );

        // Fallback to original DDC generation
        let stateCodeForDDC: string | undefined;
        if (city) {
          const cityLower = city.toLowerCase();
          if (cityLower.includes("lagos")) stateCodeForDDC = "LA";
          else if (cityLower.includes("abuja")) stateCodeForDDC = "FC";
          else if (cityLower.includes("kano")) stateCodeForDDC = "KN";
          else if (cityLower.includes("ibadan") || cityLower.includes("oyo"))
            stateCodeForDDC = "OY";
        }

        ddc = await generateHhgCode(latitude, longitude, stateCodeForDDC);
        if (ddc) {
          const ddcInfo = parseDDC(ddc);
          if (ddcInfo) {
            ({ stateCode, lgaCode, areaType, areaCode, locationNumber } =
              ddcInfo);
          }
        }
      }

      if (!ddc) {
        throw new Error(
          "Could not generate address code for the provided coordinates."
        );
      }
      // --- End Enhanced Address Generation ---

      // Create address (linked to user) using correct schema
      const newAddressResult = await tx
        .insert(addresses)
        .values({
          userId: newUser.id,
          street: noStreetAddress
            ? enhancedAddressInfo?.addressComponents?.primary || "" // Use generated street for rural areas
            : street, // Use provided street for urban areas
          city,
          houseNumber: noStreetAddress ? "" : houseNumber, // Empty if no street address
          landmark,
          floor: apartment, // Map apartment to floor field
          estate,
          specialDescription,
          photoUrls,
          latitude,
          longitude,
          hhgCode: ddc, // Store the full DDC as the hhgCode
          stateCode: clientStateCode || stateCode, // Use client-provided first
          lgaCode: clientLgaCode || lgaCode, // Use client-provided first
          areaType,
          areaCode,
          locationNumber,
          isSaved: true, // Default address should be saved
          label: "Home", // Default label?
          category: category,
        } as any)
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
  } catch (error) {
    console.error("Registration error:", error);
    if (
      error instanceof Error &&
      error.message.startsWith("Could not generate")
    ) {
      res.status(400).json({ error: error.message }); // Bad coords error
    } else if (
      error instanceof Error &&
      error.message.startsWith("Internal error parsing")
    ) {
      res.status(500).json({ error: error.message }); // HHG parsing error
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
    return;
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  // Validate request body with Zod
  const validationResult = loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    res.status(400).json({
      error: errors[0]?.message || "Validation failed",
      details: errors,
    });
    return;
  }

  const { email, password } = validationResult.data;

  try {
    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" }); // User not found
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
    return;
  }
};

// GET /api/auth/me (Protected)
export const getCurrentUser = async (req: Request, res: Response) => {
  // User should be attached by the 'protect' middleware
  if (!req.user) {
    // This should technically not happen if protect middleware is working
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Fetch full, up-to-date user details from DB using the ID from the token
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
        // isVerified: users.isVerified,
        // Add other fields as needed
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    const currentUser = userResult[0];

    if (!currentUser) {
      // User existed when token was issued, but not anymore?
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ user: currentUser });
    return;
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
    return;
  }
};
