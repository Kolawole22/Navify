import { Router } from "express";
import {
  shareAddress,
  getSharedAddress,
  getMySharedAddresses,
  getAddressesSharedWithMe,
  revokeSharedAddress,
} from "../controllers/address-sharing.controller";
import { protect } from "../middleware/auth.middleware";
import wrapAsync from "../utils/wrapAsync";

const router = Router();

// Public route - no authentication required
// GET /api/address-sharing/:code - Get shared address by code
router.get("/:code", wrapAsync(getSharedAddress));

// Protected routes
router.use(protect);

// POST /api/address-sharing - Share address
router.post("/", wrapAsync(shareAddress));

// GET /api/address-sharing/my-shares - Get user's shared addresses
router.get("/my-shares", wrapAsync(getMySharedAddresses));

// GET /api/address-sharing/shared-with-me - Get addresses shared with me
router.get("/shared-with-me", wrapAsync(getAddressesSharedWithMe));

// DELETE /api/address-sharing/:id - Revoke shared address
router.delete("/:id", wrapAsync(revokeSharedAddress));

export default router;
