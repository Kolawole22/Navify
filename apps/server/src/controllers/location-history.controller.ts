import { Request, Response } from "express";
import { db } from "../db";
import { locationHistory } from "../db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { z } from "zod";

// Add location history entry
export const addLocationHistory = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const historySchema = z.object({
    addressId: z.number().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    activity: z.enum(["search", "navigation", "visit"]).optional(),
    metadata: z.record(z.any()).optional(),
  });

  const validation = historySchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: validation.error.errors[0]?.message || "Invalid input",
    });
    return;
  }

  try {
    const newHistory = await db
      .insert(locationHistory)
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
  } catch (error) {
    console.error("Error adding location history:", error);
    res.status(500).json({ error: "Failed to add location history" });
  }
};

// Get user's location history
export const getLocationHistory = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { limit = "50", offset = "0", days } = req.query;

  try {
    let conditions = [eq(locationHistory.userId, req.user.id)];

    // Filter by days if provided
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
      conditions.push(gte(locationHistory.visitedAt, daysAgo));
    }

    const history = await db
      .select()
      .from(locationHistory)
      .where(and(...conditions))
      .orderBy(desc(locationHistory.visitedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    res.json(history);
  } catch (error) {
    console.error("Error fetching location history:", error);
    res.status(500).json({ error: "Failed to fetch location history" });
    return;
  }
};

// Clear location history
export const clearLocationHistory = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { days } = req.query;

  try {
    if (days) {
      // Clear history older than specified days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      await db
        .delete(locationHistory)
        .where(
          and(
            eq(locationHistory.userId, req.user.id),
            gte(locationHistory.visitedAt, daysAgo)
          )
        );
    } else {
      // Clear all history
      await db
        .delete(locationHistory)
        .where(eq(locationHistory.userId, req.user.id));
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error clearing location history:", error);
    res.status(500).json({ error: "Failed to clear location history" });
    return;
  }
};

// Get location analytics
export const getLocationAnalytics = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { days = "30" } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

  try {
    // Get total visits
    const totalVisits = await db
      .select({ count: locationHistory.id })
      .from(locationHistory)
      .where(
        and(
          eq(locationHistory.userId, req.user.id),
          gte(locationHistory.visitedAt, daysAgo)
        )
      );

    // Get activity breakdown
    const activityBreakdown = await db
      .select({
        activity: locationHistory.activity,
        count: locationHistory.id,
      })
      .from(locationHistory)
      .where(
        and(
          eq(locationHistory.userId, req.user.id),
          gte(locationHistory.visitedAt, daysAgo)
        )
      );

    // Get most visited areas (by coordinates rounded to 2 decimal places)
    const mostVisitedAreas = await db
      .select({
        latitude: locationHistory.latitude,
        longitude: locationHistory.longitude,
        count: locationHistory.id,
      })
      .from(locationHistory)
      .where(
        and(
          eq(locationHistory.userId, req.user.id),
          gte(locationHistory.visitedAt, daysAgo)
        )
      );

    res.json({
      totalVisits: totalVisits.length,
      activityBreakdown,
      mostVisitedAreas: mostVisitedAreas.slice(0, 10), // Top 10
    });
  } catch (error) {
    console.error("Error fetching location analytics:", error);
    res.status(500).json({ error: "Failed to fetch location analytics" });
    return;
  }
};
