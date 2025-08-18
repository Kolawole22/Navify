import { Router } from "express";
import {
  requestOtp,
  verifyOtp,
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import wrapAsync from "../utils/wrapAsync";

const router = Router();

// Public routes
router.post("/request-otp", wrapAsync(requestOtp));
router.post("/verify-otp", wrapAsync(verifyOtp));
router.post("/register", wrapAsync(register));
router.post("/login", wrapAsync(login));

// Protected route
router.get("/me", protect, wrapAsync(getCurrentUser)); // Apply protect middleware

export default router;
