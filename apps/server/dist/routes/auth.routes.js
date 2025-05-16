"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const wrapAsync_1 = __importDefault(require("../utils/wrapAsync"));
const router = (0, express_1.Router)();
// Public routes
router.post("/request-otp", (0, wrapAsync_1.default)(auth_controller_1.requestOtp));
router.post("/verify-otp", (0, wrapAsync_1.default)(auth_controller_1.verifyOtp));
router.post("/register", (0, wrapAsync_1.default)(auth_controller_1.register));
router.post("/login", (0, wrapAsync_1.default)(auth_controller_1.login));
// Protected route
router.get("/me", auth_middleware_1.protect, (0, wrapAsync_1.default)(auth_controller_1.getCurrentUser)); // Apply protect middleware
exports.default = router;
//# sourceMappingURL=auth.routes.js.map