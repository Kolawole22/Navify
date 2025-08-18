import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateCurrentUser,
  getCurrentUserProfile,
  getPreferences,
  updatePreferences,
} from "../controllers/user.controller";
import { getBookmarkedAddresses } from "../controllers/address.controller";
import wrapAsync from "../utils/wrapAsync";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Define routes and map them to wrapped controller functions
router.get("/", wrapAsync(getAllUsers));
router.get("/:id", wrapAsync(getUserById));
router.patch("/:id", wrapAsync(updateUser));
router.delete("/:id", wrapAsync(deleteUser));

// Add PATCH /me for current user profile update
router.patch("/me", protect, wrapAsync(updateCurrentUser));

// Add GET /me/profile for comprehensive user profile with location details
router.get("/me/profile", protect, wrapAsync(getCurrentUserProfile));

// User preferences endpoints
router.get("/me/preferences", protect, wrapAsync(getPreferences));
router.patch("/me/preferences", protect, wrapAsync(updatePreferences));

// Bookmarks endpoint
router.get("/me/bookmarks", protect, wrapAsync(getBookmarkedAddresses));

// Note: User creation is typically handled via an authentication route (e.g., /api/auth/register)

export default router;
