"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("../controllers/address.controller"); // Correct import path
const wrapAsync_1 = __importDefault(require("../utils/wrapAsync")); // Import the wrapper
const auth_middleware_1 = require("../middleware/auth.middleware"); // Import the actual JWT middleware
const router = express_1.default.Router();
// Apply the actual JWT protect middleware to most address routes
// Search might be public, so it's placed before protect middleware if needed
router.get("/search", (0, wrapAsync_1.default)(address_controller_1.searchAddresses)); // Wrap the search controller
// Apply protection middleware for subsequent routes
router.use(auth_middleware_1.protect);
// Define routes and map them to wrapped controller functions
router.get("/", (0, wrapAsync_1.default)(address_controller_1.getAllSavedAddresses));
router.get("/:identifier", (0, wrapAsync_1.default)(address_controller_1.getAddress));
router.post("/", (0, wrapAsync_1.default)(address_controller_1.createAddress));
router.patch("/:id", (0, wrapAsync_1.default)(address_controller_1.updateAddress)); // Changed PUT to PATCH for partial updates
// router.put("/:id", wrapAsync(updateAddress)); // Kept PUT in case full update is needed later
router.delete("/:id", (0, wrapAsync_1.default)(address_controller_1.deleteAddress));
exports.default = router;
//# sourceMappingURL=address.routes.js.map