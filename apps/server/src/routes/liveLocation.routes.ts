import { Router } from "express";
import {
  createLiveLocationSession,
  updateLocation,
  getLiveLocation,
  getUserSessions,
  stopLiveLocationSession,
  addToSession,
  removeFromSession,
} from "../controllers/liveLocation.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Create a new live location session
router.post("/sessions", protect, createLiveLocationSession);

// Get user's live location sessions
router.get("/sessions", protect, getUserSessions);

// Update location for a session
router.post("/sessions/:sessionId/location", protect, updateLocation);

// Stop a live location session
router.put("/sessions/:sessionId/stop", protect, stopLiveLocationSession);

// Add people to an existing session
router.post("/sessions/:sessionId/add", protect, addToSession);

// Remove someone from a session
router.delete(
  "/sessions/:sessionId/remove/:personalCode",
  protect,
  removeFromSession
);

// Public route to get live location (requires personal code)
router.get("/sessions/:sessionId/live", getLiveLocation);

export default router;
