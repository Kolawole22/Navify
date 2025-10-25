import { generateGridHouseNumber } from "../utils/h3-grid-numbering";
import { db } from "../db";
import { addresses } from "../db/schema";
import { isNull, and, eq } from "drizzle-orm";

/**
 * Backfill script to generate grid-based house numbers for existing addresses
 */

interface AddressRecord {
  id: number;
  latitude: string;
  longitude: string;
  houseNumber: string | null;
  generatedHouseNumber: string | null;
  h3Index: string | null;
  h3Resolution: number | null;
  hhgCode: string;
}

interface BackfillStats {
  totalAddresses: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: number; error: string }>;
}

async function fetchAddressesToBackfill(): Promise<AddressRecord[]> {
  console.log("📋 Fetching addresses that need grid numbers...");

  const result = await db
    .select({
      id: addresses.id,
      latitude: addresses.latitude,
      longitude: addresses.longitude,
      houseNumber: addresses.houseNumber,
      generatedHouseNumber: addresses.generatedHouseNumber,
      h3Index: addresses.h3Index,
      h3Resolution: addresses.h3Resolution,
      hhgCode: addresses.hhgCode,
    })
    .from(addresses)
    .where(
      and(isNull(addresses.generatedHouseNumber), isNull(addresses.h3Index))
    );

  console.log(`Found ${result.length} addresses to process`);
  return result;
}

async function updateAddressWithGridNumber(
  address: AddressRecord,
  generatedNumber: string,
  h3Index: string,
  h3Resolution: number
): Promise<boolean> {
  try {
    await db
      .update(addresses)
      .set({
        generatedHouseNumber: generatedNumber,
        h3Index: h3Index,
        h3Resolution: h3Resolution,
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, address.id));

    return true;
  } catch (error) {
    console.error(`Failed to update address ${address.id}:`, error);
    return false;
  }
}

async function processAddress(
  address: AddressRecord
): Promise<{ success: boolean; error?: string }> {
  try {
    const lat = parseFloat(address.latitude);
    const lng = parseFloat(address.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return { success: false, error: "Invalid coordinates" };
    }

    // Generate grid-based house number
    const gridResult = await generateGridHouseNumber(lat, lng);

    // Update the address with grid information
    const updateSuccess = await updateAddressWithGridNumber(
      address,
      gridResult.generatedNumber,
      gridResult.h3Index,
      gridResult.resolution
    );

    if (!updateSuccess) {
      return { success: false, error: "Database update failed" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function backfillAddresses(): Promise<BackfillStats> {
  const stats: BackfillStats = {
    totalAddresses: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch addresses that need grid numbers
    const addressesToProcess = await fetchAddressesToBackfill();
    stats.totalAddresses = addressesToProcess.length;

    if (addressesToProcess.length === 0) {
      console.log("✅ No addresses need grid number backfill");
      return stats;
    }

    console.log(
      `🚀 Starting backfill for ${addressesToProcess.length} addresses...\n`
    );

    // Process addresses in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < addressesToProcess.length; i += batchSize) {
      const batch = addressesToProcess.slice(i, i + batchSize);

      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          addressesToProcess.length / batchSize
        )} (${batch.length} addresses)...`
      );

      // Process batch in parallel
      const batchPromises = batch.map(async (address) => {
        const result = await processAddress(address);
        stats.processed++;

        if (result.success) {
          stats.successful++;
          console.log(
            `  ✅ Address ${address.id}: Generated ${
              address.generatedHouseNumber || "N/A"
            }`
          );
        } else {
          stats.failed++;
          stats.errors.push({
            id: address.id,
            error: result.error || "Unknown error",
          });
          console.log(`  ❌ Address ${address.id}: ${result.error}`);
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches to be gentle on the database
      if (i + batchSize < addressesToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error("❌ Backfill process failed:", error);
    stats.errors.push({
      id: 0,
      error: `Process error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }

  return stats;
}

async function validateBackfillResults(): Promise<void> {
  console.log("\n🔍 Validating backfill results...");

  try {
    // Check for addresses that still don't have grid numbers
    const remainingAddresses = await db
      .select({ id: addresses.id, hhgCode: addresses.hhgCode })
      .from(addresses)
      .where(isNull(addresses.generatedHouseNumber));

    if (remainingAddresses.length > 0) {
      console.log(
        `⚠️  ${remainingAddresses.length} addresses still missing grid numbers:`
      );
      remainingAddresses.forEach((addr) => {
        console.log(`   - ID: ${addr.id}, DDC: ${addr.hhgCode}`);
      });
    } else {
      console.log("✅ All addresses now have grid numbers");
    }

    // Check for potential duplicates in the same H3 cell
    const duplicateCheck = await db.execute(`
      SELECT h3_index, COUNT(*) as count, 
             STRING_AGG(generated_house_number::text, ', ') as house_numbers
      FROM addresses 
      WHERE h3_index IS NOT NULL 
      GROUP BY h3_index 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (duplicateCheck.rows.length > 0) {
      console.log(
        `\n⚠️  Found ${duplicateCheck.rows.length} H3 cells with multiple addresses:`
      );
      duplicateCheck.rows.forEach((row: any) => {
        console.log(
          `   - H3 Cell: ${row.h3_index}, Count: ${row.count}, Numbers: ${row.house_numbers}`
        );
      });
    } else {
      console.log("✅ No duplicate H3 cells found");
    }
  } catch (error) {
    console.error("❌ Validation failed:", error);
  }
}

async function main() {
  console.log("🏠 Grid Number Backfill Script");
  console.log("==============================\n");

  try {
    // Run the backfill
    const stats = await backfillAddresses();

    // Print summary
    console.log("\n📊 Backfill Summary:");
    console.log(`   Total addresses: ${stats.totalAddresses}`);
    console.log(`   Processed: ${stats.processed}`);
    console.log(`   Successful: ${stats.successful}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Skipped: ${stats.skipped}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      stats.errors.forEach((error) => {
        console.log(`   - Address ${error.id}: ${error.error}`);
      });
    }

    // Validate results
    await validateBackfillResults();

    console.log("\n🎉 Backfill completed!");

    if (stats.failed > 0) {
      console.log(
        `\n⚠️  ${stats.failed} addresses failed to process. Check the errors above.`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Backfill script failed:", error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { backfillAddresses, validateBackfillResults };
