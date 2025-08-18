import { Request, Response } from "express";
import QRCode from "qrcode";

export const generateQRCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hhgCode } = req.params;

    if (!hhgCode) {
      res.status(400).json({ error: "HHG code is required" });
      return;
    }

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(hhgCode, {
      type: "png",
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    // Set response headers for image
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    res.setHeader("Content-Length", qrCodeBuffer.length);

    // Send the QR code image
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};
