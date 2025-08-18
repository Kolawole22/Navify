import express from "express";
import { generateQRCode } from "../controllers/qr-code.controller";

const router = express.Router();

// Generate QR code for an address
router.get("/:hhgCode", generateQRCode);

export default router;
