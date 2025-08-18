import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export class QRCodeService {
  private static readonly QR_CODES_DIR = "public/qr-codes";
  private static readonly BASE_URL =
    process.env.BASE_URL || "http://localhost:3000";

  /**
   * Generate QR code for an address and save it to disk
   * @param hhgCode - The HHG code to encode in the QR code
   * @returns The URL to the generated QR code image
   */
  static async generateAndSaveQRCode(hhgCode: string): Promise<string> {
    try {
      // Ensure the QR codes directory exists
      this.ensureDirectoryExists();

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

      // Create filename with timestamp to avoid conflicts
      const timestamp = Date.now();
      const filename = `qr-${hhgCode}-${timestamp}.png`;
      const filePath = path.join(this.QR_CODES_DIR, filename);

      // Save the QR code to disk
      fs.writeFileSync(filePath, qrCodeBuffer);

      // Return the public URL
      return `${this.BASE_URL}/qr-codes/${filename}`;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error(`Failed to generate QR code for ${hhgCode}`);
    }
  }

  /**
   * Delete a QR code image file
   * @param qrCodeUrl - The URL of the QR code to delete
   */
  static deleteQRCode(qrCodeUrl: string): void {
    try {
      if (!qrCodeUrl) return;

      // Extract filename from URL
      const filename = qrCodeUrl.split("/").pop();
      if (!filename) return;

      const filePath = path.join(this.QR_CODES_DIR, filename);

      // Check if file exists before deleting
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted QR code: ${filename}`);
      }
    } catch (error) {
      console.error("Error deleting QR code:", error);
    }
  }

  /**
   * Ensure the QR codes directory exists
   */
  private static ensureDirectoryExists(): void {
    if (!fs.existsSync(this.QR_CODES_DIR)) {
      fs.mkdirSync(this.QR_CODES_DIR, { recursive: true });
    }
  }

  /**
   * Get the full path to the QR codes directory
   */
  static getQRCodesDirectory(): string {
    return path.resolve(this.QR_CODES_DIR);
  }
}
