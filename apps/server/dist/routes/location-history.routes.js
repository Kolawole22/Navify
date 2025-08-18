"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_history_controller_1 = require("../controllers/location-history.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const wrapAsync_1 = __importDefault(require("../utils/wrapAsync"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.protect);
// POST /api/location-history - Add location history entry
router.post("/", (0, wrapAsync_1.default)(location_history_controller_1.addLocationHistory));
// GET /api/location-history - Get user's location history
router.get("/", (0, wrapAsync_1.default)(location_history_controller_1.getLocationHistory));
// DELETE /api/location-history - Clear location history
router.delete("/", (0, wrapAsync_1.default)(location_history_controller_1.clearLocationHistory));
// GET /api/location-history/analytics - Get location analytics
router.get("/analytics", (0, wrapAsync_1.default)(location_history_controller_1.getLocationAnalytics));
exports.default = router;
//# sourceMappingURL=location-history.routes.js.map