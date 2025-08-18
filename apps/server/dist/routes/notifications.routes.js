"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("../controllers/notifications.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const wrapAsync_1 = __importDefault(require("../utils/wrapAsync"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
// GET /api/notifications - Get user notifications
router.get("/", (0, wrapAsync_1.default)(notifications_controller_1.getNotifications));
// GET /api/notifications/count - Get notification count
router.get("/count", (0, wrapAsync_1.default)(notifications_controller_1.getNotificationCount));
// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", (0, wrapAsync_1.default)(notifications_controller_1.markNotificationRead));
// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch("/read-all", (0, wrapAsync_1.default)(notifications_controller_1.markAllNotificationsRead));
// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", (0, wrapAsync_1.default)(notifications_controller_1.deleteNotification));
// DELETE /api/notifications - Clear old notifications
router.delete("/", (0, wrapAsync_1.default)(notifications_controller_1.clearOldNotifications));
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map