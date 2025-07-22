"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const address_categories_controller_1 = require("../controllers/address-categories.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const controller = new address_categories_controller_1.AddressCategoriesController();
// GET /api/address/categories - Get all address categories
router.get("/", async (req, res) => {
    await controller.getAll(req, res);
});
// GET /api/address/categories/:id - Get address category by ID
router.get("/:id", async (req, res) => {
    await controller.getById(req, res);
});
// Protected routes (require authentication)
// POST /api/address/categories - Create new address category
router.post("/", auth_middleware_1.protect, async (req, res) => {
    await controller.create(req, res);
});
// PUT /api/address/categories/:id - Update address category
router.put("/:id", auth_middleware_1.protect, async (req, res) => {
    await controller.update(req, res);
});
// DELETE /api/address/categories/:id - Delete address category
router.delete("/:id", auth_middleware_1.protect, async (req, res) => {
    await controller.delete(req, res);
});
exports.default = router;
//# sourceMappingURL=address-categories.routes.js.map