/**
 * Rollback script for address migration
 * This script can revert addresses back to the old format if needed
 * WARNING: This will lose the enhanced grid information
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

interface AddressRecord {
  id: number;
  hhgCode: string;
  areaType: string | null;
  areaCode: string | null;
  gridCode: string | null;
  locationNumber: string | null;
}

/**
 * Converts new format HHG code back to old format
 * NG-XX-YY-ZZZ-GG-NNNN → NG-XX-YY-ZZZ-NNNN
 */
function convertToOldFormat(hhgCode: string): string {
  const parts = hhgCode.split("-");
  if (parts.length === 6) {
    // Remove the grid code (5th part, index 4)
    const oldParts = [...parts];
    oldParts.splice(4, 1); // Remove grid code
    return oldParts.join("-");
  }
  return hhgCode; // Already in old format or invalid
}

/**
 * Gets all addresses in new format that need rollback
 */
async function getAddressesToRollback(): Promise<AddressRecord[]> {
  try {
    console.log("📋 Fetching addresses in new format...");

    const result = await db.execute(sql`
      SELECT 
        id,
        hhg_code,
        area_type,
        area_code,
        grid_code,
        location_number
      FROM addresses
      WHERE hhg_code LIKE 'NG-%-%-%-%-%-%'
      ORDER BY id
    `);

    const addresses = result.rows as unknown as AddressRecord[];
    console.log(`📊 Found ${addresses.length} addresses in new format`);

    return addresses;
  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    throw error;
  }
}

/**
 * Rolls back a single address to old format
 */
async function rollbackAddress(address: AddressRecord): Promise<{
  success: boolean;
  oldCode: string;
  newCode: string;
  error?: string;
}> {
  try {
    const oldFormatCode = convertToOldFormat(address.hhgCode);

    // Update the address in the database
    await db.execute(sql`
      UPDATE addresses 
      SET 
        hhg_code = ${oldFormatCode},
        area_type = NULL,
        area_code = NULL,
        grid_code = NULL,
        location_number = NULL,
        updated_at = NOW()
      WHERE id = ${address.id}
    `);

    return {
      success: true,
      oldCode: address.hhgCode,
      newCode: oldFormatCode,
    };
  } catch (error) {
    return {
      success: false,
      oldCode: address.hhgCode,
      newCode: address.hhgCode,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main rollback function
 */
async function rollbackAddressMigration(): Promise<void> {
  console.log("🔄 Starting address migration rollback...");
  console.log("⚠️  WARNING: This will remove enhanced grid information!");
  console.log("=".repeat(60));

  try {
    // Get all addresses in new format
    const addresses = await getAddressesToRollback();

    if (addresses.length === 0) {
      console.log("ℹ️  No addresses in new format found to rollback");
      return;
    }

    // Rollback each address
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: number; error: string; oldCode: string }> = [];

    console.log("\n🔄 Rolling back addresses...");
    console.log("-".repeat(60));

    for (const address of addresses) {
      const result = await rollbackAddress(address);

      if (result.success) {
        successCount++;
        console.log(
          `✅ ID ${address.id}: ${result.oldCode} → ${result.newCode}`
        );
      } else {
        errorCount++;
        errors.push({
          id: address.id,
          error: result.error || "Unknown error",
          oldCode: result.oldCode,
        });
        console.log(`❌ ID ${address.id}: ${result.error} (${result.oldCode})`);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Rollback Summary:");
    console.log(`   ✅ Successfully rolled back: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total processed: ${addresses.length}`);

    if (errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      errors.forEach(({ id, error, oldCode }) => {
        console.log(`   ID ${id}: ${error} (${oldCode})`);
      });
    }

    console.log("\n🎉 Rollback completed!");
  } catch (error) {
    console.error("💥 Rollback failed:", error);
    throw error;
  }
}

// Run rollback if this file is executed directly
if (require.main === module) {
  rollbackAddressMigration().catch((error) => {
    console.error("Rollback failed:", error);
    process.exit(1);
  });
}

export { rollbackAddressMigration };
