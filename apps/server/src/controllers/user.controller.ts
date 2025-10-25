import { Request, Response } from "express";
// Remove Prisma imports
// import { prisma } from "../index";
// import { Prisma } from "@prisma/client";
import { db } from "../db"; // Import Drizzle db instance
import { users } from "../db/schema"; // Import users table schema
import { eq, desc, and } from "drizzle-orm"; // Import eq operator for WHERE clauses
import { z } from "zod";
import { addresses } from "../db/schema"; // Import addresses table schema
import { locationHistory } from "../db/schema"; // Import location history table schema
import { notifications } from "../db/schema"; // Import notifications table schema

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

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    // TODO: Add admin-only protection if needed
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
      })
      .from(users);

    res.json(userList);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    // Validate if ID is a valid UUID if necessary before querying
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
        // TODO: Add relation querying for addresses if needed
        // addresses: addresses, // Drizzle relation querying is slightly different
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user); // Already excludes passwordHash by selection
  } catch (error) {
    console.error("Error fetching user:", error);
    // TODO: Add specific Drizzle error handling if needed
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateUser = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    // Destructure only fields present in your users schema for update
    const { firstName, lastName, email, phoneNumber } = req.body;

    // Basic validation (consider using Zod)
    if (!firstName && !lastName && !email && !phoneNumber) {
      res.status(400).json({
        error:
          "At least one field (firstName, lastName, email, phoneNumber) is required for update",
      });
      return;
    }

    // Construct the update object dynamically
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    updateData.updatedAt = new Date(); // Manually update updatedAt

    const updatedResult = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        updatedAt: users.updatedAt,
      });

    const updatedUser = updatedResult[0];

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
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

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const deleteResult = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id }); // Check if any row was actually deleted

    // If returning array is empty, the user didn't exist
    if (deleteResult.length === 0) {
      // Technically user not found, but DELETE is often idempotent.
      // Returning 204 is common practice.
      // return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error deleting user:", error);
    // TODO: Add specific Drizzle error handling
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// PATCH /users/me - Update current user's profile
export const updateCurrentUser = async (req: Request, res: Response) => {
  // req.user is set by the protect middleware
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Zod schema for profile update
  const profileSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(1).optional(),
  });

  const validation = profileSchema.safeParse(req.body);
  if (!validation.success) {
    res
      .status(400)
      .json({ error: validation.error.errors[0]?.message || "Invalid input" });
    return;
  }

  const updateData: Partial<typeof users.$inferInsert> = { ...validation.data };
  updateData.updatedAt = new Date();

  try {
    const updatedResult = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.user.id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        updatedAt: users.updatedAt,
      });
    const updatedUser = updatedResult[0];
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updatedUser);
  } catch (error) {
    // TODO: Add specific Drizzle error handling (e.g., for unique constraints)
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

// Get comprehensive current user profile with location details
export const getCurrentUserProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Get user basic info
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
        personalCode: users.personalCode,
        preferences: users.preferences,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      // User existed when token was issued, but not anymore - treat as unauthorized
      res.status(401).json({ error: "Unauthorized: User no longer exists" });
      return;
    }

    // Get user's addresses
    const userAddresses = await db
      .select({
        id: addresses.id,
        hhgCode: addresses.hhgCode,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
        street: addresses.street,
        city: addresses.city,
        stateCode: addresses.stateCode,
        lgaCode: addresses.lgaCode,
        areaType: addresses.areaType,
        areaCode: addresses.areaCode,
        locationNumber: addresses.locationNumber,
        houseNumber: addresses.houseNumber,
        generatedHouseNumber: addresses.generatedHouseNumber,
        estate: addresses.estate,
        floor: addresses.floor,
        landmark: addresses.landmark,
        specialDescription: addresses.specialDescription,
        category: addresses.category,
        isSaved: addresses.isSaved,
        label: addresses.label,
        createdAt: addresses.createdAt,
      })
      .from(addresses)
      .where(eq(addresses.userId, req.user.id))
      .orderBy(desc(addresses.createdAt))
      .limit(10); // Limit to recent 10 addresses

    // Get recent location history
    const recentLocations = await db
      .select({
        id: locationHistory.id,
        latitude: locationHistory.latitude,
        longitude: locationHistory.longitude,
        activity: locationHistory.activity,
        visitedAt: locationHistory.visitedAt,
        metadata: locationHistory.metadata,
      })
      .from(locationHistory)
      .where(eq(locationHistory.userId, req.user.id))
      .orderBy(desc(locationHistory.visitedAt))
      .limit(5); // Limit to recent 5 locations

    // Get unread notifications count
    const unreadNotifications = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.read, false)
        )
      );

    // Calculate some basic stats
    const totalAddresses = userAddresses.length;
    const totalLocations = await db
      .select({ count: locationHistory.id })
      .from(locationHistory)
      .where(eq(locationHistory.userId, req.user.id));

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
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// --- User Preferences Controllers ---

export const getPreferences = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const userResult = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    const preferences = userResult[0]?.preferences || {};
    res.json({ preferences });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
};

const preferencesSchema = z.object({
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  language: z.string().optional(),
  units: z.string().optional(),
});

export const updatePreferences = async (req: Request, res: Response) => {
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
    const userResult = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    const current = userResult[0]?.preferences || {};
    const updated = { ...current, ...validation.data };
    await db
      .update(users)
      .set({ preferences: updated })
      .where(eq(users.id, req.user.id));
    res.json({ preferences: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
};
