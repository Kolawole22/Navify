import express from "express";
import {
  getAllStates,
  getLgasByState,
} from "../controllers/location.controller"; // Remove .js extension

const router = express.Router();

// Route to get all states
router.get("/states", getAllStates);

// Route to get LGAs for a specific state by state code
router.get("/states/:stateCode/lgas", getLgasByState);

export default router;
