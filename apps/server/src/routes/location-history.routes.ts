import { Router } from "express";
import {
  addLocationHistory,
  getLocationHistory,
  clearLocationHistory,
  getLocationAnalytics,
} from "../controllers/location-history.controller";
import { protect } from "../middleware/auth.middleware";
import wrapAsync from "../utils/wrapAsync";

const router = Router();

// All routes require authentication
router.use(protect);

// POST /api/location-history - Add location history entry
router.post("/", wrapAsync(addLocationHistory));

// GET /api/location-history - Get user's location history
router.get("/", wrapAsync(getLocationHistory));

// DELETE /api/location-history - Clear location history
router.delete("/", wrapAsync(clearLocationHistory));

// GET /api/location-history/analytics - Get location analytics
router.get("/analytics", wrapAsync(getLocationAnalytics));

export default router;
