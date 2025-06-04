import express from "express";
import {
  getAllSavedAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  searchAddresses,
} from "../controllers/address.controller"; // Correct import path
import wrapAsync from "../utils/wrapAsync"; // Import the wrapper
import { protect } from "../middleware/auth.middleware"; // Import the actual JWT middleware
import { Request, Response } from "express";

const router = express.Router();

// Apply the actual JWT protect middleware to most address routes
// Search might be public, so it's placed before protect middleware if needed
router.get("/search", wrapAsync(searchAddresses)); // Wrap the search controller

// Apply protection middleware for subsequent routes
router.use(protect);

// Define routes and map them to wrapped controller functions
router.get("/", wrapAsync(getAllSavedAddresses));
router.get("/:identifier", wrapAsync(getAddress));
router.post("/", wrapAsync(createAddress));
router.patch("/:id", wrapAsync(updateAddress)); // Changed PUT to PATCH for partial updates
// router.put("/:id", wrapAsync(updateAddress)); // Kept PUT in case full update is needed later
router.delete("/:id", wrapAsync(deleteAddress));

// POST /api/addresses/rural-suggestions
const getRuralSuggestions = async (req: Request, res: Response) => {
  const { latitude, longitude, city, userInput } = req.body;

  if (!latitude || !longitude || !city) {
    res.status(400).json({
      error: "Latitude, longitude, and city are required",
    });
  }

  const { generateRuralAddressComponents } = await import(
    "../utils/rural-addressing"
  );

  const suggestions = await generateRuralAddressComponents(
    parseFloat(latitude),
    parseFloat(longitude),
    city,
    userInput
  );

  res.status(200).json({
    success: true,
    data: suggestions,
  });
};

router.post("/rural-suggestions", wrapAsync(getRuralSuggestions));

export default router;
