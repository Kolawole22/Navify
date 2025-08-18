"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.getNotificationCount = exports.clearOldNotifications = exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// Get user notifications
const getNotifications = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { limit = "20", offset = "0", unreadOnly = "false" } = req.query;
    try {
        let conditions = [(0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.user.id)];
        if (unreadOnly === "true") {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.notifications.read, false));
        }
        const userNotifications = await db_1.db
            .select()
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))
            .limit(parseInt(limit))
            .offset(parseInt(offset));
        res.json(userNotifications);
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markNotificationRead = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { id } = req.params;
    try {
        const updatedNotification = await db_1.db
            .update(schema_1.notifications)
            .set({ read: true })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.id, id), (0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.user.id)))
            .returning();
        if (updatedNotification.length === 0) {
            res.status(404).json({ error: "Notification not found" });
            return;
        }
        res.json(updatedNotification[0]);
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
};
exports.markNotificationRead = markNotificationRead;
// Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        await db_1.db
            .update(schema_1.notifications)
            .set({ read: true })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.user.id));
        res.status(204).send();
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
// Delete notification
const deleteNotification = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { id } = req.params;
    try {
        const deletedNotification = await db_1.db
            .delete(schema_1.notifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.id, id), (0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.user.id)))
            .returning();
        if (deletedNotification.length === 0) {
            res.status(404).json({ error: "Notification not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
};
exports.deleteNotification = deleteNotification;
// Clear old notifications
const clearOldNotifications = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { days = "30" } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    try {
        await db_1.db
            .delete(schema_1.notifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.user.id), (0, drizzle_orm_1.lt)(schema_1.notifications.createdAt, daysAgo)));
        res.status(204).send();
    }
    catch (error) {
        console.error("Error clearing old notifications:", error);
        res.status(500).json({ error: "Failed to clear old notifications" });
    }
};
exports.clearOldNotifications = clearOldNotifications;
// Get notification count
const getNotificationCount = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const unreadCount = await db_1.db
            .select({ count: schema_1.notifications.id })
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.notifications.read, false)));
        res.json({ unreadCount: unreadCount.length });
    }
    catch (error) {
        console.error("Error fetching notification count:", error);
        res.status(500).json({ error: "Failed to fetch notification count" });
    }
};
exports.getNotificationCount = getNotificationCount;
// Create notification (internal use)
const createNotification = async (userId, title, message, type, data) => {
    try {
        const notification = await db_1.db
            .insert(schema_1.notifications)
            .values({
            userId,
            title,
            message,
            type,
            data,
        })
            .returning();
        return notification[0];
    }
    catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=notifications.controller.js.map