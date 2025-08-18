import express from "express";
import { AddressCategoriesController } from "../controllers/address-categories.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();
const controller = new AddressCategoriesController();

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
router.post("/", protect, async (req, res) => {
  await controller.create(req, res);
});

// PUT /api/address/categories/:id - Update address category
router.put("/:id", protect, async (req, res) => {
  await controller.update(req, res);
});

// DELETE /api/address/categories/:id - Delete address category
router.delete("/:id", protect, async (req, res) => {
  await controller.delete(req, res);
});

export default router;
