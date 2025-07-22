"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationAnalytics = exports.clearLocationHistory = exports.getLocationHistory = exports.addLocationHistory = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
// Add location history entry
const addLocationHistory = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const historySchema = zod_1.z.object({
        addressId: zod_1.z.number().optional(),
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        activity: zod_1.z.enum(["search", "navigation", "visit"]).optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
    });
    const validation = historySchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({
            error: validation.error.errors[0]?.message || "Invalid input",
        });
        return;
    }
    try {
        const newHistory = await db_1.db
            .insert(schema_1.locationHistory)
            .values({
            userId: req.user.id,
            addressId: validation.data.addressId,
            latitude: validation.data.latitude.toString(),
            longitude: validation.data.longitude.toString(),
            activity: validation.data.activity,
            metadata: validation.data.metadata,
        })
            .returning();
        res.status(201).json(newHistory[0]);
    }
    catch (error) {
        console.error("Error adding location history:", error);
        res.status(500).json({ error: "Failed to add location history" });
    }
};
exports.addLocationHistory = addLocationHistory;
// Get user's location history
const getLocationHistory = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { limit = "50", offset = "0", days } = req.query;
    try {
        let conditions = [(0, drizzle_orm_1.eq)(schema_1.locationHistory.userId, req.user.id)];
        // Filter by days if provided
        if (days) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            conditions.push((0, drizzle_orm_1.gte)(schema_1.locationHistory.visitedAt, daysAgo));
        }
        const history = await db_1.db
            .select()
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.locationHistory.visitedAt))
            .limit(parseInt(limit))
            .offset(parseInt(offset));
        res.json(history);
    }
    catch (error) {
        console.error("Error fetching location history:", error);
        res.status(500).json({ error: "Failed to fetch location history" });
        return;
    }
};
exports.getLocationHistory = getLocationHistory;
// Clear location history
const clearLocationHistory = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { days } = req.query;
    try {
        if (days) {
            // Clear history older than specified days
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            await db_1.db
                .delete(schema_1.locationHistory)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.locationHistory.userId, req.user.id), (0, drizzle_orm_1.gte)(schema_1.locationHistory.visitedAt, daysAgo)));
        }
        else {
            // Clear all history
            await db_1.db
                .delete(schema_1.locationHistory)
                .where((0, drizzle_orm_1.eq)(schema_1.locationHistory.userId, req.user.id));
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error clearing location history:", error);
        res.status(500).json({ error: "Failed to clear location history" });
        return;
    }
};
exports.clearLocationHistory = clearLocationHistory;
// Get location analytics
const getLocationAnalytics = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { days = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    try {
        // Get total visits
        const totalVisits = await db_1.db
            .select({ count: schema_1.locationHistory.id })
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.locationHistory.userId, req.user.id), (0, drizzle_orm_1.gte)(schema_1.locationHistory.visitedAt, daysAgo)));
        // Get activity breakdown
        const activityBreakdown = await db_1.db
            .select({
            activity: schema_1.locationHistory.activity,
            count: schema_1.locationHistory.id,
        })
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.locationHistory.userId, req.user.id), (0, drizzle_orm_1.gte)(schema_1.locationHistory.visitedAt, daysAgo)));
        // Get most visited areas (by coordinates rounded to 2 decimal places)
        const mostVisitedAreas = await db_1.db
            .select({
            latitude: schema_1.locationHistory.latitude,
            longitude: schema_1.locationHistory.longitude,
            count: schema_1.locationHistory.id,
        })
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.locationHistory.userId, req.user.id), (0, drizzle_orm_1.gte)(schema_1.locationHistory.visitedAt, daysAgo)));
        res.json({
            totalVisits: totalVisits.length,
            activityBreakdown,
            mostVisitedAreas: mostVisitedAreas.slice(0, 10), // Top 10
        });
    }
    catch (error) {
        console.error("Error fetching location analytics:", error);
        res.status(500).json({ error: "Failed to fetch location analytics" });
        return;
    }
};
exports.getLocationAnalytics = getLocationAnalytics;
//# sourceMappingURL=location-history.controller.js.map