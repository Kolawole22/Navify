"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const address_sharing_controller_1 = require("../controllers/address-sharing.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const wrapAsync_1 = __importDefault(require("../utils/wrapAsync"));
const router = (0, express_1.Router)();
// Public route - no authentication required
// GET /api/address-sharing/:code - Get shared address by code
router.get("/:code", (0, wrapAsync_1.default)(address_sharing_controller_1.getSharedAddress));
// Protected routes
router.use(auth_middleware_1.protect);
// POST /api/address-sharing - Share address
router.post("/", (0, wrapAsync_1.default)(address_sharing_controller_1.shareAddress));
// GET /api/address-sharing/my-shares - Get user's shared addresses
router.get("/my-shares", (0, wrapAsync_1.default)(address_sharing_controller_1.getMySharedAddresses));
// GET /api/address-sharing/shared-with-me - Get addresses shared with me
router.get("/shared-with-me", (0, wrapAsync_1.default)(address_sharing_controller_1.getAddressesSharedWithMe));
// DELETE /api/address-sharing/:id - Revoke shared address
router.delete("/:id", (0, wrapAsync_1.default)(address_sharing_controller_1.revokeSharedAddress));
exports.default = router;
//# sourceMappingURL=address-sharing.routes.js.map