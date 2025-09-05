"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferences = exports.getPreferences = exports.getCurrentUserProfile = exports.updateCurrentUser = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
// Remove Prisma imports
// import { prisma } from "../index";
// import { Prisma } from "@prisma/client";
const db_1 = require("../db"); // Import Drizzle db instance
const schema_1 = require("../db/schema"); // Import users table schema
const drizzle_orm_1 = require("drizzle-orm"); // Import eq operator for WHERE clauses
const zod_1 = require("zod");
const schema_2 = require("../db/schema"); // Import addresses table schema
const schema_3 = require("../db/schema"); // Import location history table schema
const schema_4 = require("../db/schema"); // Import notifications table schema
// Remove Prisma error type guard if no longer needed, or adapt if Drizzle has specific error types
// function isPrismaKnownError(error: unknown): error is { code: string } {
//   return typeof error === "object" && error !== null && "code" in error;
// }
// Helper function to exclude fields (like passwordHash)
// const excludePassword = <T, Key extends keyof T>(
//   user: T,
//   key: Key
// ): Omit<T, Key> => {
//   const { [key]: _, ...rest } = user;
//   return rest;
// };
// Controller Functions
const getAllUsers = async (_req, res) => {
    try {
        // TODO: Add admin-only protection if needed
        const userList = await db_1.db
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            phoneNumber: schema_1.users.phoneNumber,
            createdAt: schema_1.users.createdAt,
        })
            .from(schema_1.users);
        res.json(userList);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate if ID is a valid UUID if necessary before querying
        const userResult = await db_1.db
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            phoneNumber: schema_1.users.phoneNumber,
            createdAt: schema_1.users.createdAt,
            // TODO: Add relation querying for addresses if needed
            // addresses: addresses, // Drizzle relation querying is slightly different
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(user); // Already excludes passwordHash by selection
    }
    catch (error) {
        console.error("Error fetching user:", error);
        // TODO: Add specific Drizzle error handling if needed
        res.status(500).json({ error: "Failed to fetch user" });
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Destructure only fields present in your users schema for update
        const { firstName, lastName, email, phoneNumber } = req.body;
        // Basic validation (consider using Zod)
        if (!firstName && !lastName && !email && !phoneNumber) {
            res.status(400).json({
                error: "At least one field (firstName, lastName, email, phoneNumber) is required for update",
            });
            return;
        }
        // Construct the update object dynamically
        const updateData = {};
        if (firstName)
            updateData.firstName = firstName;
        if (lastName)
            updateData.lastName = lastName;
        if (email)
            updateData.email = email;
        if (phoneNumber)
            updateData.phoneNumber = phoneNumber;
        updateData.updatedAt = new Date(); // Manually update updatedAt
        const updatedResult = await db_1.db
            .update(schema_1.users)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning({
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            phoneNumber: schema_1.users.phoneNumber,
            updatedAt: schema_1.users.updatedAt,
        });
        const updatedUser = updatedResult[0];
        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Error updating user:", error);
        // TODO: Add specific Drizzle error handling (e.g., for unique constraints)
        // Drizzle errors might differ from Prisma's P2025/P2002
        // Check the error object structure or use instanceof for specific driver errors
        // Example placeholder for unique constraint violation:
        // if (error instanceof PostgresError && error.code === '23505') { // Check pg error codes
        //   return res.status(409).json({ error: "Email or phone number already in use." });
        // }
        res.status(500).json({ error: "Failed to update user" });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteResult = await db_1.db
            .delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning({ id: schema_1.users.id }); // Check if any row was actually deleted
        // If returning array is empty, the user didn't exist
        if (deleteResult.length === 0) {
            // Technically user not found, but DELETE is often idempotent.
            // Returning 204 is common practice.
            // return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send(); // No content
    }
    catch (error) {
        console.error("Error deleting user:", error);
        // TODO: Add specific Drizzle error handling
        res.status(500).json({ error: "Failed to delete user" });
    }
};
exports.deleteUser = deleteUser;
// PATCH /users/me - Update current user's profile
const updateCurrentUser = async (req, res) => {
    // req.user is set by the protect middleware
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    // Zod schema for profile update
    const profileSchema = zod_1.z.object({
        firstName: zod_1.z.string().min(1).optional(),
        lastName: zod_1.z.string().min(1).optional(),
        email: zod_1.z.string().email().optional(),
        phoneNumber: zod_1.z.string().min(1).optional(),
    });
    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
        res
            .status(400)
            .json({ error: validation.error.errors[0]?.message || "Invalid input" });
        return;
    }
    const updateData = { ...validation.data };
    updateData.updatedAt = new Date();
    try {
        const updatedResult = await db_1.db
            .update(schema_1.users)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.id))
            .returning({
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            phoneNumber: schema_1.users.phoneNumber,
            updatedAt: schema_1.users.updatedAt,
        });
        const updatedUser = updatedResult[0];
        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(updatedUser);
    }
    catch (error) {
        // TODO: Add specific Drizzle error handling (e.g., for unique constraints)
        res.status(500).json({ error: "Failed to update user profile" });
    }
};
exports.updateCurrentUser = updateCurrentUser;
// Get comprehensive current user profile with location details
const getCurrentUserProfile = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        // Get user basic info
        const userResult = await db_1.db
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            firstName: schema_1.users.firstName,
            lastName: schema_1.users.lastName,
            phoneNumber: schema_1.users.phoneNumber,
            personalCode: schema_1.users.personalCode,
            preferences: schema_1.users.preferences,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.id))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Get user's addresses
        const userAddresses = await db_1.db
            .select({
            id: schema_2.addresses.id,
            hhgCode: schema_2.addresses.hhgCode,
            latitude: schema_2.addresses.latitude,
            longitude: schema_2.addresses.longitude,
            street: schema_2.addresses.street,
            city: schema_2.addresses.city,
            stateCode: schema_2.addresses.stateCode,
            lgaCode: schema_2.addresses.lgaCode,
            areaType: schema_2.addresses.areaType,
            areaCode: schema_2.addresses.areaCode,
            locationNumber: schema_2.addresses.locationNumber,
            houseNumber: schema_2.addresses.houseNumber,
            estate: schema_2.addresses.estate,
            floor: schema_2.addresses.floor,
            landmark: schema_2.addresses.landmark,
            specialDescription: schema_2.addresses.specialDescription,
            category: schema_2.addresses.category,
            isSaved: schema_2.addresses.isSaved,
            label: schema_2.addresses.label,
            createdAt: schema_2.addresses.createdAt,
        })
            .from(schema_2.addresses)
            .where((0, drizzle_orm_1.eq)(schema_2.addresses.userId, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_2.addresses.createdAt))
            .limit(10); // Limit to recent 10 addresses
        // Get recent location history
        const recentLocations = await db_1.db
            .select({
            id: schema_3.locationHistory.id,
            latitude: schema_3.locationHistory.latitude,
            longitude: schema_3.locationHistory.longitude,
            activity: schema_3.locationHistory.activity,
            visitedAt: schema_3.locationHistory.visitedAt,
            metadata: schema_3.locationHistory.metadata,
        })
            .from(schema_3.locationHistory)
            .where((0, drizzle_orm_1.eq)(schema_3.locationHistory.userId, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_3.locationHistory.visitedAt))
            .limit(5); // Limit to recent 5 locations
        // Get unread notifications count
        const unreadNotifications = await db_1.db
            .select({ count: schema_4.notifications.id })
            .from(schema_4.notifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_4.notifications.userId, req.user.id), (0, drizzle_orm_1.eq)(schema_4.notifications.read, false)));
        // Calculate some basic stats
        const totalAddresses = userAddresses.length;
        const totalLocations = await db_1.db
            .select({ count: schema_3.locationHistory.id })
            .from(schema_3.locationHistory)
            .where((0, drizzle_orm_1.eq)(schema_3.locationHistory.userId, req.user.id));
        const profile = {
            user: {
                ...user,
                fullName: `${user.firstName} ${user.lastName}`.trim(),
            },
            stats: {
                totalAddresses,
                totalLocations: totalLocations.length,
                unreadNotifications: unreadNotifications.length,
            },
            recentAddresses: userAddresses,
            recentLocations,
        };
        res.json(profile);
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
};
exports.getCurrentUserProfile = getCurrentUserProfile;
// --- User Preferences Controllers ---
const getPreferences = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const userResult = await db_1.db
            .select({ preferences: schema_1.users.preferences })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.id))
            .limit(1);
        const preferences = userResult[0]?.preferences || {};
        res.json({ preferences });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch preferences" });
    }
};
exports.getPreferences = getPreferences;
const preferencesSchema = zod_1.z.object({
    darkMode: zod_1.z.boolean().optional(),
    notifications: zod_1.z.boolean().optional(),
    language: zod_1.z.string().optional(),
    units: zod_1.z.string().optional(),
});
const updatePreferences = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const validation = preferencesSchema.safeParse(req.body);
    if (!validation.success) {
        res
            .status(400)
            .json({ error: validation.error.errors[0]?.message || "Invalid input" });
        return;
    }
    try {
        // Merge new preferences with existing
        const userResult = await db_1.db
            .select({ preferences: schema_1.users.preferences })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.id))
            .limit(1);
        const current = userResult[0]?.preferences || {};
        const updated = { ...current, ...validation.data };
        await db_1.db
            .update(schema_1.users)
            .set({ preferences: updated })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.id));
        res.json({ preferences: updated });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update preferences" });
    }
};
exports.updatePreferences = updatePreferences;
//# sourceMappingURL=user.controller.js.map