"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const wrapAsync_1 = __importDefault(require("../utils/wrapAsync"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Define routes and map them to wrapped controller functions
router.get("/", (0, wrapAsync_1.default)(user_controller_1.getAllUsers));
router.get("/:id", (0, wrapAsync_1.default)(user_controller_1.getUserById));
router.patch("/:id", (0, wrapAsync_1.default)(user_controller_1.updateUser));
router.delete("/:id", (0, wrapAsync_1.default)(user_controller_1.deleteUser));
// Add PATCH /me for current user profile update
router.patch("/me", auth_middleware_1.protect, (0, wrapAsync_1.default)(user_controller_1.updateCurrentUser));
// Add GET /me/profile for comprehensive user profile with location details
router.get("/me/profile", auth_middleware_1.protect, (0, wrapAsync_1.default)(user_controller_1.getCurrentUserProfile));
// User preferences endpoints
router.get("/me/preferences", auth_middleware_1.protect, (0, wrapAsync_1.default)(user_controller_1.getPreferences));
router.patch("/me/preferences", auth_middleware_1.protect, (0, wrapAsync_1.default)(user_controller_1.updatePreferences));
// Note: User creation is typically handled via an authentication route (e.g., /api/auth/register)
exports.default = router;
//# sourceMappingURL=user.routes.js.map