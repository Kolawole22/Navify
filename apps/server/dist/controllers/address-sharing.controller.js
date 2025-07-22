"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredShares = exports.revokeSharedAddress = exports.getAddressesSharedWithMe = exports.getMySharedAddresses = exports.getSharedAddress = exports.shareAddress = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
// Share address
const shareAddress = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const shareSchema = zod_1.z.object({
        addressId: zod_1.z.number(),
        sharedWith: zod_1.z.string().uuid().optional(), // User ID to share with
        expiresIn: zod_1.z.number().optional(), // Days until expiration
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
        const address = await db_1.db
            .select()
            .from(schema_1.addresses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, validation.data.addressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, req.user.id)))
            .limit(1);
        if (address.length === 0) {
            res.status(404).json({ error: "Address not found" });
            return;
        }
        // Generate unique share code
        const shareCode = crypto_1.default.randomBytes(16).toString("hex");
        // Calculate expiration date
        const expiresAt = validation.data.expiresIn
            ? new Date(Date.now() + validation.data.expiresIn * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
        const newShare = await db_1.db
            .insert(schema_1.addressShares)
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
            shareUrl: `${process.env.FRONTEND_URL || "https://navify.app"}/share/${shareCode}`,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${process.env.FRONTEND_URL || "https://navify.app"}/share/${shareCode}`)}`,
        });
    }
    catch (error) {
        console.error("Error sharing address:", error);
        res.status(500).json({ error: "Failed to share address" });
    }
};
exports.shareAddress = shareAddress;
// Get shared address by code
const getSharedAddress = async (req, res) => {
    const { code } = req.params;
    try {
        const sharedAddress = await db_1.db
            .select({
            id: schema_1.addressShares.id,
            shareCode: schema_1.addressShares.shareCode,
            expiresAt: schema_1.addressShares.expiresAt,
            viewed: schema_1.addressShares.viewed,
            createdAt: schema_1.addressShares.createdAt,
            address: {
                id: schema_1.addresses.id,
                hhgCode: schema_1.addresses.hhgCode,
                street: schema_1.addresses.street,
                city: schema_1.addresses.city,
                stateCode: schema_1.addresses.stateCode,
                lgaCode: schema_1.addresses.lgaCode,
                latitude: schema_1.addresses.latitude,
                longitude: schema_1.addresses.longitude,
                landmark: schema_1.addresses.landmark,
                specialDescription: schema_1.addresses.specialDescription,
                category: schema_1.addresses.category,
            },
            sharedBy: {
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
            },
        })
            .from(schema_1.addressShares)
            .innerJoin(schema_1.addresses, (0, drizzle_orm_1.eq)(schema_1.addressShares.addressId, schema_1.addresses.id))
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.addressShares.sharedBy, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.addressShares.shareCode, code))
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
            await db_1.db
                .update(schema_1.addressShares)
                .set({ viewed: true })
                .where((0, drizzle_orm_1.eq)(schema_1.addressShares.id, share.id));
        }
        res.json(share);
    }
    catch (error) {
        console.error("Error fetching shared address:", error);
        res.status(500).json({ error: "Failed to fetch shared address" });
    }
};
exports.getSharedAddress = getSharedAddress;
// Get user's shared addresses
const getMySharedAddresses = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { limit = "20", offset = "0" } = req.query;
    try {
        const sharedAddresses = await db_1.db
            .select({
            id: schema_1.addressShares.id,
            shareCode: schema_1.addressShares.shareCode,
            expiresAt: schema_1.addressShares.expiresAt,
            viewed: schema_1.addressShares.viewed,
            createdAt: schema_1.addressShares.createdAt,
            address: {
                id: schema_1.addresses.id,
                hhgCode: schema_1.addresses.hhgCode,
                street: schema_1.addresses.street,
                city: schema_1.addresses.city,
                stateCode: schema_1.addresses.stateCode,
            },
            sharedWith: {
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
            },
        })
            .from(schema_1.addressShares)
            .innerJoin(schema_1.addresses, (0, drizzle_orm_1.eq)(schema_1.addressShares.addressId, schema_1.addresses.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.addressShares.sharedWith, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.addressShares.sharedBy, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.addressShares.createdAt))
            .limit(parseInt(limit))
            .offset(parseInt(offset));
        res.json(sharedAddresses);
    }
    catch (error) {
        console.error("Error fetching shared addresses:", error);
        res.status(500).json({ error: "Failed to fetch shared addresses" });
    }
};
exports.getMySharedAddresses = getMySharedAddresses;
// Get addresses shared with me
const getAddressesSharedWithMe = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { limit = "20", offset = "0" } = req.query;
    try {
        const sharedAddresses = await db_1.db
            .select({
            id: schema_1.addressShares.id,
            shareCode: schema_1.addressShares.shareCode,
            expiresAt: schema_1.addressShares.expiresAt,
            viewed: schema_1.addressShares.viewed,
            createdAt: schema_1.addressShares.createdAt,
            address: {
                id: schema_1.addresses.id,
                hhgCode: schema_1.addresses.hhgCode,
                street: schema_1.addresses.street,
                city: schema_1.addresses.city,
                stateCode: schema_1.addresses.stateCode,
                latitude: schema_1.addresses.latitude,
                longitude: schema_1.addresses.longitude,
            },
            sharedBy: {
                id: schema_1.users.id,
                firstName: schema_1.users.firstName,
                lastName: schema_1.users.lastName,
            },
        })
            .from(schema_1.addressShares)
            .innerJoin(schema_1.addresses, (0, drizzle_orm_1.eq)(schema_1.addressShares.addressId, schema_1.addresses.id))
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.addressShares.sharedBy, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.addressShares.sharedWith, req.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.addressShares.createdAt))
            .limit(parseInt(limit))
            .offset(parseInt(offset));
        res.json(sharedAddresses);
    }
    catch (error) {
        console.error("Error fetching addresses shared with me:", error);
        res.status(500).json({ error: "Failed to fetch addresses shared with me" });
    }
};
exports.getAddressesSharedWithMe = getAddressesSharedWithMe;
// Revoke shared address
const revokeSharedAddress = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { id } = req.params;
    try {
        const deletedShare = await db_1.db
            .delete(schema_1.addressShares)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addressShares.id, id), (0, drizzle_orm_1.eq)(schema_1.addressShares.sharedBy, req.user.id)))
            .returning();
        if (deletedShare.length === 0) {
            res.status(404).json({ error: "Shared address not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error revoking shared address:", error);
        res.status(500).json({ error: "Failed to revoke shared address" });
    }
};
exports.revokeSharedAddress = revokeSharedAddress;
// Clean up expired shares (cron job)
const cleanupExpiredShares = async () => {
    try {
        await db_1.db
            .delete(schema_1.addressShares)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.addressShares.expiresAt, new Date()), (0, drizzle_orm_1.isNull)(schema_1.addressShares.expiresAt)));
    }
    catch (error) {
        console.error("Error cleaning up expired shares:", error);
    }
};
exports.cleanupExpiredShares = cleanupExpiredShares;
//# sourceMappingURL=address-sharing.controller.js.map