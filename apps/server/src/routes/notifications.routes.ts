import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearOldNotifications,
  getNotificationCount,
} from "../controllers/notifications.controller";
import { protect } from "../middleware/auth.middleware";
import wrapAsync from "../utils/wrapAsync";

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/notifications - Get user notifications
router.get("/", wrapAsync(getNotifications));

// GET /api/notifications/count - Get notification count
router.get("/count", wrapAsync(getNotificationCount));

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", wrapAsync(markNotificationRead));

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch("/read-all", wrapAsync(markAllNotificationsRead));

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", wrapAsync(deleteNotification));

// DELETE /api/notifications - Clear old notifications
router.delete("/", wrapAsync(clearOldNotifications));

export default router;
