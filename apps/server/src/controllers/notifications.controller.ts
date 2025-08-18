import { Request, Response } from "express";
import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, desc, and, lt } from "drizzle-orm";

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { limit = "20", offset = "0", unreadOnly = "false" } = req.query;

  try {
    let conditions = [eq(notifications.userId, req.user.id)];

    if (unreadOnly === "true") {
      conditions.push(eq(notifications.read, false));
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    res.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const updatedNotification = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(eq(notifications.id, id), eq(notifications.userId, req.user.id))
      )
      .returning();

    if (updatedNotification.length === 0) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json(updatedNotification[0]);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, req.user.id));

    res.status(204).send();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const deletedNotification = await db
      .delete(notifications)
      .where(
        and(eq(notifications.id, id), eq(notifications.userId, req.user.id))
      )
      .returning();

    if (deletedNotification.length === 0) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Clear old notifications
export const clearOldNotifications = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { days = "30" } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

  try {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          lt(notifications.createdAt, daysAgo)
        )
      );

    res.status(204).send();
  } catch (error) {
    console.error("Error clearing old notifications:", error);
    res.status(500).json({ error: "Failed to clear old notifications" });
  }
};

// Get notification count
export const getNotificationCount = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const unreadCount = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, req.user.id),
          eq(notifications.read, false)
        )
      );

    res.json({ unreadCount: unreadCount.length });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    res.status(500).json({ error: "Failed to fetch notification count" });
  }
};

// Create notification (internal use)
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  data?: Record<string, any>
) => {
  try {
    const notification = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type,
        data,
      })
      .returning();

    return notification[0];
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};
