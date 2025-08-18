import { db } from "../db";
import { addresses } from "../db/schema";
import { QRCodeService } from "../services/qrCodeService";
import { eq, isNull } from "drizzle-orm";

/**
 * Script to generate QR codes for all existing addresses that don't have them
 * Run this after adding the qr_code_image_url field to the database
 */
async function generateQRCodesForExistingAddresses() {
  try {
    console.log("🔍 Finding addresses without QR codes...");

    // Find all addresses without QR codes
    const addressesWithoutQR = await db
      .select({
        id: addresses.id,
        hhgCode: addresses.hhgCode,
        qrCodeImageUrl: addresses.qrCodeImageUrl,
      })
      .from(addresses)
      .where(isNull(addresses.qrCodeImageUrl));

    console.log(
      `📊 Found ${addressesWithoutQR.length} addresses without QR codes`
    );

    if (addressesWithoutQR.length === 0) {
      console.log("✅ All addresses already have QR codes!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Generate QR codes for each address
    for (const address of addressesWithoutQR) {
      try {
        console.log(`🔄 Generating QR code for ${address.hhgCode}...`);

        // Generate and save QR code
        const qrCodeUrl = await QRCodeService.generateAndSaveQRCode(
          address.hhgCode
        );

        // Update the address in the database
        await db
          .update(addresses)
          .set({
            qrCodeImageUrl: qrCodeUrl,
            updatedAt: new Date(),
          })
          .where(eq(addresses.id, address.id));

        console.log(
          `✅ Generated QR code for ${address.hhgCode}: ${qrCodeUrl}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to generate QR code for ${address.hhgCode}:`,
          error
        );
        errorCount++;
      }
    }

    console.log("\n📈 Summary:");
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total processed: ${addressesWithoutQR.length}`);
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  generateQRCodesForExistingAddresses()
    .then(() => {
      console.log("🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { generateQRCodesForExistingAddresses };
