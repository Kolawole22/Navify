import { Request, Response } from "express";
import { db } from "../db";
import { addressShares, addresses, users } from "../db/schema";
import { eq, and, desc, lt, isNull } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// Share address
export const shareAddress = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const shareSchema = z.object({
    addressId: z.number(),
    sharedWith: z.string().uuid().optional(), // User ID to share with
    expiresIn: z.number().optional(), // Days until expiration
  });

  const validation = shareSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors[0]?.message || "Invalid input",
    });
    return;
  }

  try {
    // Verify address exists and belongs to user
    const address = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.id, validation.data.addressId),
          eq(addresses.userId, req.user.id)
        )
      )
      .limit(1);

    if (address.length === 0) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    // Generate unique share code
    const shareCode = crypto.randomBytes(16).toString("hex");

    // Calculate expiration date
    const expiresAt = validation.data.expiresIn
      ? new Date(Date.now() + validation.data.expiresIn * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const newShare = await db
      .insert(addressShares)
      .values({
        addressId: validation.data.addressId,
        sharedBy: req.user.id,
        sharedWith: validation.data.sharedWith,
        shareCode,
        expiresAt,
      })
      .returning();

    res.status(201).json({
      ...newShare[0],
      shareUrl: `${
        process.env.FRONTEND_URL || "https://navify.app"
      }/share/${shareCode}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `${process.env.FRONTEND_URL || "https://navify.app"}/share/${shareCode}`
      )}`,
    });
  } catch (error) {
    console.error("Error sharing address:", error);
    res.status(500).json({ error: "Failed to share address" });
  }
};

// Get shared address by code
export const getSharedAddress = async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    const sharedAddress = await db
      .select({
        id: addressShares.id,
        shareCode: addressShares.shareCode,
        expiresAt: addressShares.expiresAt,
        viewed: addressShares.viewed,
        createdAt: addressShares.createdAt,
        address: {
          id: addresses.id,
          hhgCode: addresses.hhgCode,
          street: addresses.street,
          city: addresses.city,
          stateCode: addresses.stateCode,
          lgaCode: addresses.lgaCode,
          latitude: addresses.latitude,
          longitude: addresses.longitude,
          landmark: addresses.landmark,
          specialDescription: addresses.specialDescription,
          category: addresses.category,
        },
        sharedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(addressShares)
      .innerJoin(addresses, eq(addressShares.addressId, addresses.id))
      .innerJoin(users, eq(addressShares.sharedBy, users.id))
      .where(eq(addressShares.shareCode, code))
      .limit(1);

    if (sharedAddress.length === 0) {
      res.status(404).json({ error: "Shared address not found" });
      return;
    }

    const share = sharedAddress[0];

    // Check if expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      res.status(410).json({ error: "Shared address has expired" });
      return;
    }

    // Mark as viewed if not already
    if (!share.viewed) {
      await db
        .update(addressShares)
        .set({ viewed: true })
        .where(eq(addressShares.id, share.id));
    }

    res.json(share);
  } catch (error) {
    console.error("Error fetching shared address:", error);
    res.status(500).json({ error: "Failed to fetch shared address" });
  }
};

// Get user's shared addresses
export const getMySharedAddresses = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { limit = "20", offset = "0" } = req.query;

  try {
    const sharedAddresses = await db
      .select({
        id: addressShares.id,
        shareCode: addressShares.shareCode,
        expiresAt: addressShares.expiresAt,
        viewed: addressShares.viewed,
        createdAt: addressShares.createdAt,
        address: {
          id: addresses.id,
          hhgCode: addresses.hhgCode,
          street: addresses.street,
          city: addresses.city,
          stateCode: addresses.stateCode,
        },
        sharedWith: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(addressShares)
      .innerJoin(addresses, eq(addressShares.addressId, addresses.id))
      .leftJoin(users, eq(addressShares.sharedWith, users.id))
      .where(eq(addressShares.sharedBy, req.user.id))
      .orderBy(desc(addressShares.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json(sharedAddresses);
  } catch (error) {
    console.error("Error fetching shared addresses:", error);
    res.status(500).json({ error: "Failed to fetch shared addresses" });
  }
};

// Get addresses shared with me
export const getAddressesSharedWithMe = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { limit = "20", offset = "0" } = req.query;

  try {
    const sharedAddresses = await db
      .select({
        id: addressShares.id,
        shareCode: addressShares.shareCode,
        expiresAt: addressShares.expiresAt,
        viewed: addressShares.viewed,
        createdAt: addressShares.createdAt,
        address: {
          id: addresses.id,
          hhgCode: addresses.hhgCode,
          street: addresses.street,
          city: addresses.city,
          stateCode: addresses.stateCode,
          latitude: addresses.latitude,
          longitude: addresses.longitude,
        },
        sharedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(addressShares)
      .innerJoin(addresses, eq(addressShares.addressId, addresses.id))
      .innerJoin(users, eq(addressShares.sharedBy, users.id))
      .where(eq(addressShares.sharedWith, req.user.id))
      .orderBy(desc(addressShares.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json(sharedAddresses);
  } catch (error) {
    console.error("Error fetching addresses shared with me:", error);
    res.status(500).json({ error: "Failed to fetch addresses shared with me" });
  }
};

// Revoke shared address
export const revokeSharedAddress = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const deletedShare = await db
      .delete(addressShares)
      .where(
        and(eq(addressShares.id, id), eq(addressShares.sharedBy, req.user.id))
      )
      .returning();

    if (deletedShare.length === 0) {
      res.status(404).json({ error: "Shared address not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error revoking shared address:", error);
    res.status(500).json({ error: "Failed to revoke shared address" });
  }
};

// Clean up expired shares (cron job)
export const cleanupExpiredShares = async () => {
  try {
    await db
      .delete(addressShares)
      .where(
        and(
          lt(addressShares.expiresAt, new Date()),
          isNull(addressShares.expiresAt)
        )
      );
  } catch (error) {
    console.error("Error cleaning up expired shares:", error);
  }
};
