import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import wrapAsync from "../utils/wrapAsync";

const router = Router();

// Define routes and map them to wrapped controller functions
router.get("/", wrapAsync(getAllUsers));
router.get("/:id", wrapAsync(getUserById));
router.put("/:id", wrapAsync(updateUser));
router.delete("/:id", wrapAsync(deleteUser));

// Note: User creation is typically handled via an authentication route (e.g., /api/auth/register)

export default router;
