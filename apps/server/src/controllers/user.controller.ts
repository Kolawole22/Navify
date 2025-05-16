import { Request, Response } from "express";
// Remove Prisma imports
// import { prisma } from "../index";
// import { Prisma } from "@prisma/client";
import { db } from "../db"; // Import Drizzle db instance
import { users } from "../db/schema"; // Import users table schema
import { eq } from "drizzle-orm"; // Import eq operator for WHERE clauses

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
