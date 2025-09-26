#!/usr/bin/env tsx

/**
 * Rollback script for simplified HHG format
 *
 * This script helps identify addresses that were updated to the simplified format
 * and provides information about reverting them if needed.
 *
 * Note: This is a read-only script for analysis. Actual rollback would require
 * restoring from backup or regenerating addresses with the old format.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

interface AddressRecord {
  id: number;
  hhgCode: string;
  latitude: string;
  longitude: string;
  street?: string;
  landmark?: string;
  houseNumber?: string;
  stateCode?: string;
  lgaCode?: string;
  areaType?: string;
  areaCode?: string;
  locationNumber?: string;
  gridCode?: string;
  createdAt: string;
  updatedAt: string;
}

async function analyzeAddressFormats(): Promise<void> {
  try {
    console.log("📊 Analyzing address formats in database...\n");

    // Fetch all addresses
    const result = await db.execute(sql`
      SELECT 
        id, hhg_code, latitude, longitude, street, landmark, house_number,
        state_code, lga_code, area_type, area_code, location_number, grid_code,
        created_at, updated_at
      FROM addresses
      WHERE hhg_code IS NOT NULL
      ORDER BY id
    `);

    const addresses = result.rows as unknown as AddressRecord[];
    console.log(`📊 Found ${addresses.length} addresses total\n`);

    // Analyze formats
    const newFormatRegex =
      /^NG-([A-Z]{2})-(\d{2})-([A-Z0-9]{3})-(\d{1,5})-(\d{4})$/;
    const oldFormatRegex =
      /^NG-([A-Z]{2})-(\d{2})-([A-Z0-9]{3})-([A-Z0-9]{2})-(\d{4})$/;

    let newFormatCount = 0;
    let oldFormatCount = 0;
    let unknownFormatCount = 0;
    const newFormatAddresses: AddressRecord[] = [];
    const oldFormatAddresses: AddressRecord[] = [];

    for (const address of addresses) {
      if (newFormatRegex.test(address.hhgCode)) {
        newFormatCount++;
        newFormatAddresses.push(address);
      } else if (oldFormatRegex.test(address.hhgCode)) {
        oldFormatCount++;
        oldFormatAddresses.push(address);
      } else {
        unknownFormatCount++;
        console.log(
          `⚠️  Unknown format: ${address.hhgCode} (ID: ${address.id})`
        );
      }
    }

    console.log("📊 Format Analysis:");
    console.log(`✅ New simplified format: ${newFormatCount} addresses`);
    console.log(`🔄 Old format: ${oldFormatCount} addresses`);
    console.log(`❓ Unknown format: ${unknownFormatCount} addresses\n`);

    // Show examples of each format
    if (newFormatAddresses.length > 0) {
      console.log("📝 Examples of new simplified format:");
      newFormatAddresses.slice(0, 5).forEach((addr) => {
        console.log(`   ID ${addr.id}: ${addr.hhgCode}`);
      });
      if (newFormatAddresses.length > 5) {
        console.log(`   ... and ${newFormatAddresses.length - 5} more`);
      }
      console.log();
    }

    if (oldFormatAddresses.length > 0) {
      console.log("📝 Examples of old format:");
      oldFormatAddresses.slice(0, 5).forEach((addr) => {
        console.log(`   ID ${addr.id}: ${addr.hhgCode}`);
      });
      if (oldFormatAddresses.length > 5) {
        console.log(`   ... and ${oldFormatAddresses.length - 5} more`);
      }
      console.log();
    }

    // Show recent updates
    const recentUpdates = addresses
      .filter(
        (addr) =>
          addr.updatedAt &&
          new Date(addr.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
      )
      .slice(0, 10);

    if (recentUpdates.length > 0) {
      console.log("🕒 Recently updated addresses (last 24 hours):");
      recentUpdates.forEach((addr) => {
        const format = newFormatRegex.test(addr.hhgCode) ? "NEW" : "OLD";
        console.log(
          `   ID ${addr.id}: ${addr.hhgCode} (${format}) - ${addr.updatedAt}`
        );
      });
      console.log();
    }

    // Grid code analysis
    const addressesWithGridCode = addresses.filter(
      (addr) => addr.gridCode && addr.gridCode !== ""
    );
    const addressesWithoutGridCode = addresses.filter(
      (addr) => !addr.gridCode || addr.gridCode === ""
    );

    console.log("🔍 Grid Code Analysis:");
    console.log(`   With grid_code: ${addressesWithGridCode.length} addresses`);
    console.log(
      `   Without grid_code: ${addressesWithoutGridCode.length} addresses\n`
    );

    // Recommendations
    console.log("💡 Recommendations:");
    if (newFormatCount > 0 && oldFormatCount > 0) {
      console.log(
        "   ⚠️  Mixed formats detected. Consider running the update script to standardize."
      );
    } else if (newFormatCount > 0 && oldFormatCount === 0) {
      console.log("   ✅ All addresses are in the new simplified format.");
    } else if (oldFormatCount > 0 && newFormatCount === 0) {
      console.log(
        "   🔄 All addresses are in the old format. Run the update script to migrate."
      );
    }

    if (addressesWithGridCode.length > 0) {
      console.log(
        "   🗑️  Some addresses still have grid_code values. These can be safely removed."
      );
    }
  } catch (error) {
    console.error("❌ Error analyzing addresses:", error);
    throw error;
  }
}

async function showRollbackInstructions(): Promise<void> {
  console.log("\n📋 Rollback Instructions:");
  console.log("   If you need to rollback the simplified format changes:");
  console.log("   1. Restore from database backup (recommended)");
  console.log("   2. Or regenerate addresses using the old format logic");
  console.log("   3. Or manually update addresses back to old format");
  console.log(
    "\n   ⚠️  This script is read-only and does not perform actual rollback."
  );
  console.log("   ⚠️  Always backup your database before making changes.");
}

async function main() {
  console.log("🔍 Address Format Analysis Tool");
  console.log("📝 This tool analyzes the current state of address formats\n");

  try {
    await analyzeAddressFormats();
    await showRollbackInstructions();
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✅ Analysis completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Analysis failed:", error);
      process.exit(1);
    });
}

export { main as analyzeAddressFormats };
