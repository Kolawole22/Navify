import { Request, Response } from "express";
import { db } from "../db"; // Import Drizzle db instance
import { addresses } from "../db/schema"; // Import Drizzle schemas
import { eq, and, or, ilike } from "drizzle-orm"; // Import operators
import { z } from "zod";
import { SQL } from "drizzle-orm";
import { generateHhgCode } from "../utils/addressing"; // Import the HHG code generator

// Validation Schema for Address Creation/Update
// Aligned with Drizzle schema and project scope
const addressInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  houseNumber: z.string().optional(), // Make houseNumber optional based on schema
  estate: z.string().optional(),
  specialDescription: z.string().optional(),
  floor: z.string().optional(),
  landmark: z.string().optional(),
  category: z.string().optional(), // Add optional category
  // context: z.string().optional(), // Removed context if not in schema
  // userId is handled internally via auth
  isSaved: z.boolean().optional().default(false), // Adjusted default to false
  label: z.string().optional(), // Label primarily used when updating/saving
  photoUrls: z.array(z.string().url()).optional(), // Added photoUrls based on schema
});

// Schema for updating only specific fields like label or saved status
const addressUpdateSchema = z.object({
  isSaved: z.boolean().optional(),
  label: z.string().optional().nullable(), // Allow clearing label
  category: z.string().optional().nullable(), // Allow updating/clearing category
  // Potentially allow updating context/landmark later?
});

// Generate a unique Navify code (placeholder - consider a more robust method)
// function generateUniqueAddressCode(): string {
//   // Simple example, might need collision checks or a better algorithm
//   const prefix = "NAV";
//   const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Reduced ambiguous chars
//   let result = prefix;
//   for (let i = 0; i < 6; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
//   // TODO: Ensure uniqueness in the database before finalizing
// }

// --- Controller Functions ---

// Get all *saved* addresses for the authenticated user
export const getAllSavedAddresses = async (req: Request, res: Response) => {
  try {
    // Assume userId is populated by authentication middleware
    // @ts-ignore - Assuming req.user exists after auth middleware
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.userId, userId),
          eq(addresses.isSaved, true) // Only fetch explicitly saved addresses
        )
      )
      .orderBy(addresses.updatedAt); // Or createdAt?

    res.json(userAddresses);
    return; // Explicitly return after sending response
  } catch (error: any) {
    console.error("Error fetching saved addresses:", error);
    res.status(500).json({ error: "Failed to fetch saved addresses" });
    return; // Explicitly return after sending response
  }
};

// Get a specific address by its uniqueCode or DB ID
export const getAddress = async (
  req: Request<{ identifier: string }>, // Can be uniqueCode or DB ID
  res: Response
) => {
  try {
    const { identifier } = req.params;
    // @ts-ignore
    const userId = req.user?.id as string | undefined; // Needed for ownership check if it's a saved address

    let addressResult;
    let queryCondition: SQL<unknown>;

    // Check if identifier is likely a number (DB ID) or string (uniqueCode)
    const isDbId = /^\d+$/.test(identifier);

    if (isDbId) {
      queryCondition = eq(addresses.id, parseInt(identifier, 10));
    } else {
      queryCondition = eq(addresses.hhgCode, identifier);
    }

    addressResult = await db
      .select()
      .from(addresses)
      .where(queryCondition)
      .limit(1);

    const address = addressResult[0];

    if (!address) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    // If the address is associated with a user, check ownership
    if (address.userId) {
      if (!userId || address.userId !== userId) {
        // Allow fetching public/unowned addresses? Or always require auth?
        // For now, restrict access if it has a userId and doesn't match req.user.id
        res
          .status(403)
          .json({ error: "Forbidden: You do not own this address" });
        return;
      }
    }
    // If address.userId is null, assume it's a generally accessible address (e.g., generated but not saved by a specific user)
    // Modify this logic based on your application's access control requirements.

    res.json(address);
  } catch (error: any) {
    console.error("Error fetching address:", error);
    if (
      error instanceof Error &&
      error.message.includes("invalid input syntax for type integer")
    ) {
      res.status(400).json({ error: "Invalid address ID format" });
      return;
    }
    res.status(500).json({ error: "Failed to fetch address" });
    return;
  }
};

// Create a new address entry (generates unique code)
export const createAddress = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string | undefined;

    const validationResult = addressInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
    }

    const inputData = validationResult.data;

    // Generate the HHG code using the utility
    const hhgCode = await generateHhgCode(
      inputData.latitude,
      inputData.longitude
    );

    if (!hhgCode) {
      res.status(400).json({
        error:
          "Could not generate address code for the provided coordinates. Ensure location is within Nigeria.",
      });
      return;
    }

    // Parse stateCode and lgaCode from hhgCode (e.g., NG-LA-015-9FG4P8M)
    const codeParts = hhgCode.split("-");
    if (codeParts.length !== 4) {
      console.error(`Failed to parse generated HHG code: ${hhgCode}`);
      res
        .status(500)
        .json({ error: "Internal error generating address components." });
      return;
    }
    const stateCode = codeParts[1];
    const lgaCode = codeParts[2];

    // Prepare data for insertion using the correct schema fields
    const newAddressData = {
      // Fields from input
      latitude: inputData.latitude.toString(),
      longitude: inputData.longitude.toString(),
      street: inputData.street,
      city: inputData.city,
      houseNumber: inputData.houseNumber,
      estate: inputData.estate,
      floor: inputData.floor,
      specialDescription: inputData.specialDescription,
      landmark: inputData.landmark,
      photoUrls: inputData.photoUrls,
      userId: userId,
      isSaved: inputData.isSaved,
      label: inputData.label,
      category: inputData.category,
      // Derived/Generated fields
      hhgCode: hhgCode,
      stateCode: stateCode,
      lgaCode: lgaCode,
    };

    const insertedResult = await db
      .insert(addresses)
      .values(newAddressData)
      .returning();

    const newAddress = insertedResult[0];

    res.status(201).json(newAddress);
    return;
  } catch (error: unknown) {
    console.error("Error creating address:", error);
    // Handle potential unique constraint violation on hhgCode (less likely but possible)
    res.status(500).json({ error: "Failed to create address" });
    return;
  }
};

// Update an existing address (e.g., save/unsave, add/change label)
export const updateAddress = async (
  req: Request<{ id: string }>, // Use DB ID for updates
  res: Response
) => {
  try {
    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      res.status(400).json({ error: "Invalid address ID format" });
      return;
    }

    // @ts-ignore
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const validationResult = addressUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.format(),
      });
      return;
    }

    const { isSaved, label, category } = validationResult.data;

    // Construct update data - only include fields that are provided
    const updateData: Partial<typeof addresses.$inferInsert> = {};
    if (isSaved !== undefined) updateData.isSaved = isSaved;
    // Allow setting label to null to clear it
    if (label !== undefined) updateData.label = label;
    if (category !== undefined) updateData.category = category;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields provided for update." });
      return;
    }

    updateData.updatedAt = new Date(); // Manually update timestamp

    const updatedResult = await db
      .update(addresses)
      .set(updateData)
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.userId, userId) // Ensure user owns the address
        )
      )
      .returning();

    const updatedAddress = updatedResult[0];

    if (!updatedAddress) {
      // Could be not found OR forbidden, check if address exists without userId condition?
      // For simplicity, return 404, but could check existence first for a 403.
      res.status(404).json({
        error: "Address not found or you do not have permission to update it",
      });
      return;
    }

    res.json(updatedAddress);
  } catch (error: unknown) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
};

// Delete a saved address (logically or physically)
export const deleteAddress = async (
  req: Request<{ id: string }>, // Use DB ID for deletion
  res: Response
) => {
  try {
    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      res.status(400).json({ error: "Invalid address ID format" });
      return;
    }
    // @ts-ignore
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // We only allow deleting addresses explicitly saved by the user.
    const deleteResult = await db
      .delete(addresses)
      .where(
        and(
          eq(addresses.id, addressId),
          eq(addresses.userId, userId) // Ensure user owns the address
        )
      )
      .returning({ id: addresses.id });

    // If nothing was deleted, it means either the address didn't exist
    // or it didn't belong to the user. Return 204 regardless for idempotency.
    if (deleteResult.length === 0) {
      // Optional: Log this case? "Attempted to delete non-existent or unauthorized address"
    }

    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

// Search for addresses based on a query string
export const searchAddresses = async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || typeof query !== "string" || query.trim().length < 1) {
    res
      .status(400)
      .json({ error: "Search query 'q' is required and must be a string." });
    return;
  }

  const searchTerm = `%${query.trim()}%`; // Prepare for LIKE/ILIKE
  const limit = 10; // Limit results

  try {
    // @ts-ignore - Assuming req.user might exist for personalized search later
    // const userId = req.user?.id as string | undefined;

    const searchResults = await db
      .select() // Select all columns for now
      .from(addresses)
      .where(
        or(
          ilike(addresses.street, searchTerm),
          ilike(addresses.city, searchTerm),
          ilike(addresses.landmark, searchTerm),
          ilike(addresses.estate, searchTerm),
          ilike(addresses.specialDescription, searchTerm),
          ilike(addresses.hhgCode, searchTerm)
          // Add other relevant fields like LGA name? (Requires join)
        )
        // Optionally, filter by userId if personalization is needed:
        // and(eq(addresses.userId, userId))
      )
      .limit(limit)
      .orderBy(addresses.city, addresses.street); // Basic ordering

    res.json(searchResults);
  } catch (error: any) {
    console.error("Error searching addresses:", error);
    res.status(500).json({ error: "Failed to search addresses" });
  }
};
