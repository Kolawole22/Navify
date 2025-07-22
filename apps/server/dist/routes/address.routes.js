"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
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
// Bookmark endpoints
router.post("/:id/bookmark", auth_middleware_1.protect, (0, wrapAsync_1.default)(address_controller_1.bookmarkAddress));
router.delete("/:id/bookmark", auth_middleware_1.protect, (0, wrapAsync_1.default)(address_controller_1.unbookmarkAddress));
// Bookmarks list for current user
const userRouter = express_1.default.Router();
exports.userRouter = userRouter;
userRouter.get("/me/bookmarks", auth_middleware_1.protect, (0, wrapAsync_1.default)(address_controller_1.getBookmarkedAddresses));
// POST /api/addresses/rural-suggestions
const getRuralSuggestions = async (req, res) => {
    const { latitude, longitude, city, userInput } = req.body;
    if (!latitude || !longitude || !city) {
        res.status(400).json({
            error: "Latitude, longitude, and city are required",
        });
    }
    const { generateRuralAddressComponents } = await Promise.resolve().then(() => __importStar(require("../utils/rural-addressing")));
    const suggestions = await generateRuralAddressComponents(parseFloat(latitude), parseFloat(longitude), city, userInput);
    res.status(200).json({
        success: true,
        data: suggestions,
    });
};
router.post("/rural-suggestions", (0, wrapAsync_1.default)(getRuralSuggestions));
exports.default = router;
//# sourceMappingURL=address.routes.js.map