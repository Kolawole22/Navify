// /**
//  * Migration script to update existing addresses to use the enhanced HHG code format
//  * This script will:
//  * 1. Add gridCode column to addresses table if it doesn't exist
//  * 2. Update all existing addresses to use the new enhanced format
//  * 3. Preserve existing data while upgrading the HHG codes
//  */

// import { db } from "../db";
// import { generateHhgCode, parseDDC } from "../utils/addressing";
// import { sql } from "drizzle-orm";

// interface AddressRecord {
//   id: number;
//   hhgCode: string;
//   latitude: string;
//   longitude: string;
//   street: string | null;
//   landmark: string | null;
//   houseNumber: string | null;
//   stateCode: string | null;
//   lgaCode: string | null;
//   areaType: string | null;
//   areaCode: string | null;
//   locationNumber: string | null;
// }

// /**
//  * Adds the gridCode column to the addresses table if it doesn't exist
//  */
// async function addGridCodeColumn(): Promise<void> {
//   try {
//     console.log("🔧 Adding gridCode column to addresses table...");

//     // Check if column already exists
//     const columnExists = await db.execute(sql`
//       SELECT column_name
//       FROM information_schema.columns
//       WHERE table_name = 'addresses'
//       AND column_name = 'grid_code'
//     `);

//     if (columnExists.rows.length === 0) {
//       // Add the gridCode column
//       await db.execute(sql`
//         ALTER TABLE addresses
//         ADD COLUMN grid_code TEXT
//       `);
//       console.log("✅ Added gridCode column to addresses table");
//     } else {
//       console.log("ℹ️  gridCode column already exists");
//     }
//   } catch (error) {
//     console.error("❌ Error adding gridCode column:", error);
//     throw error;
//   }
// }

// /**
//  * Gets all existing addresses that need to be migrated
//  */
// async function getAddressesToMigrate(): Promise<AddressRecord[]> {
//   try {
//     console.log("📋 Fetching existing addresses...");

//     const result = await db.execute(sql`
//       SELECT
//         id,
//         hhg_code,
//         latitude,
//         longitude,
//         street,
//         landmark,
//         house_number,
//         state_code,
//         lga_code,
//         area_type,
//         area_code,
//         location_number
//       FROM addresses
//       ORDER BY id
//     `);

//     const addresses = result.rows as unknown as AddressRecord[];
//     console.log(`📊 Found ${addresses.length} addresses to migrate`);

//     return addresses;
//   } catch (error) {
//     console.error("❌ Error fetching addresses:", error);
//     throw error;
//   }
// }

// /**
//  * Checks if an address is already in the new format
//  */
// function isNewFormat(hhgCode: string | null | undefined): boolean {
//   if (!hhgCode || typeof hhgCode !== "string") {
//     return false;
//   }

//   // New format: NG-XX-YY-ZZZ-GG-NNNN (6 parts)
//   // Old format: NG-XX-YY-ZZZ-NNNN (5 parts)
//   const parts = hhgCode.split("-");
//   return parts.length === 6;
// }

// /**
//  * Migrates a single address to the new format
//  */
// async function migrateAddress(address: AddressRecord): Promise<{
//   success: boolean;
//   oldCode: string;
//   newCode: string | null;
//   error?: string;
// }> {
//   try {
//     // Skip if already in new format
//     if (isNewFormat(address.hhgCode)) {
//       return {
//         success: true,
//         oldCode: address.hhgCode,
//         newCode: address.hhgCode,
//       };
//     }

//     // Parse coordinates
//     const latitude = parseFloat(address.latitude);
//     const longitude = parseFloat(address.longitude);

//     if (isNaN(latitude) || isNaN(longitude)) {
//       return {
//         success: false,
//         oldCode: address.hhgCode,
//         newCode: null,
//         error: "Invalid coordinates",
//       };
//     }

//     // Handle undefined/null values
//     const street = address.street || undefined;
//     const landmark = address.landmark || undefined;
//     const houseNumber = address.houseNumber || undefined;
//     const stateCode = address.stateCode || undefined;
//     const lgaCode = address.lgaCode || undefined;

//     // Generate new enhanced HHG code
//     const newHhgCode = await generateHhgCode(
//       latitude,
//       longitude,
//       street,
//       landmark,
//       houseNumber,
//       stateCode,
//       lgaCode
//     );

//     if (!newHhgCode) {
//       return {
//         success: false,
//         oldCode: address.hhgCode,
//         newCode: null,
//         error: "Failed to generate new HHG code",
//       };
//     }

//     // Parse the new code to get components
//     const parsed = parseDDC(newHhgCode);
//     if (!parsed) {
//       return {
//         success: false,
//         oldCode: address.hhgCode,
//         newCode: null,
//         error: "Failed to parse new HHG code",
//       };
//     }

//     // Update the address in the database
//     await db.execute(sql`
//       UPDATE addresses
//       SET
//         hhg_code = ${newHhgCode},
//         area_type = ${parsed.areaType},
//         area_code = ${parsed.areaCode},
//         grid_code = NULL,
//         location_number = ${parsed.locationNumber},
//         updated_at = NOW()
//       WHERE id = ${address.id}
//     `);

//     return {
//       success: true,
//       oldCode: address.hhgCode,
//       newCode: newHhgCode,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       oldCode: address.hhgCode,
//       newCode: null,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }

// /**
//  * Main migration function
//  */
// async function migrateAddressesToEnhancedFormat(): Promise<void> {
//   console.log("🚀 Starting address migration to enhanced format...");
//   console.log("=".repeat(60));

//   try {
//     // Step 1: Add gridCode column
//     await addGridCodeColumn();

//     // Step 2: Get all addresses
//     const addresses = await getAddressesToMigrate();

//     if (addresses.length === 0) {
//       console.log("ℹ️  No addresses found to migrate");
//       return;
//     }

//     // Step 3: Migrate each address
//     let successCount = 0;
//     let skipCount = 0;
//     let errorCount = 0;
//     const errors: Array<{ id: number; error: string; oldCode: string }> = [];

//     console.log("\n🔄 Migrating addresses...");
//     console.log("-".repeat(60));

//     for (const address of addresses) {
//       const result = await migrateAddress(address);

//       if (result.success) {
//         if (result.oldCode === result.newCode) {
//           skipCount++;
//           console.log(
//             `⏭️  ID ${address.id}: Already in new format (${result.oldCode})`
//           );
//         } else {
//           successCount++;
//           console.log(
//             `✅ ID ${address.id}: ${result.oldCode} → ${result.newCode}`
//           );
//         }
//       } else {
//         errorCount++;
//         errors.push({
//           id: address.id,
//           error: result.error || "Unknown error",
//           oldCode: result.oldCode,
//         });
//         console.log(`❌ ID ${address.id}: ${result.error} (${result.oldCode})`);
//       }
//     }

//     // Step 4: Summary
//     console.log("\n" + "=".repeat(60));
//     console.log("📊 Migration Summary:");
//     console.log(`   ✅ Successfully migrated: ${successCount}`);
//     console.log(`   ⏭️  Already in new format: ${skipCount}`);
//     console.log(`   ❌ Errors: ${errorCount}`);
//     console.log(`   📋 Total processed: ${addresses.length}`);

//     if (errors.length > 0) {
//       console.log("\n❌ Errors encountered:");
//       errors.forEach(({ id, error, oldCode }) => {
//         console.log(`   ID ${id}: ${error} (${oldCode})`);
//       });
//     }

//     console.log("\n🎉 Migration completed!");
//   } catch (error) {
//     console.error("💥 Migration failed:", error);
//     throw error;
//   }
// }

// /**
//  * Validates the migration by checking a sample of addresses
//  */
// async function validateMigration(): Promise<void> {
//   console.log("\n🔍 Validating migration...");

//   try {
//     const result = await db.execute(sql`
//       SELECT
//         id,
//         hhg_code,
//         area_type,
//         area_code,
//         grid_code,
//         location_number
//       FROM addresses
//       ORDER BY id
//       LIMIT 10
//     `);

//     const sampleAddresses = result.rows as Array<{
//       id: number;
//       hhg_code: string;
//       area_type: string | null;
//       area_code: string | null;
//       grid_code: string | null;
//       location_number: string | null;
//     }>;

//     console.log("📋 Sample of migrated addresses:");
//     console.log("-".repeat(80));

//     for (const addr of sampleAddresses) {
//       const isNew = isNewFormat(addr.hhg_code);
//       const status = isNew ? "✅ NEW" : "❌ OLD";

//       console.log(`${status} ID ${addr.id}: ${addr.hhg_code}`);
//       if (isNew) {
//         console.log(
//           `     Type: ${addr.area_type}, Area: ${addr.area_code}, Grid: ${addr.grid_code}, Location: ${addr.location_number}`
//         );
//       }
//     }
//   } catch (error) {
//     console.error("❌ Validation failed:", error);
//   }
// }

// // Run migration if this file is executed directly
// if (require.main === module) {
//   migrateAddressesToEnhancedFormat()
//     .then(() => validateMigration())
//     .catch((error) => {
//       console.error("Migration failed:", error);
//       process.exit(1);
//     });
// }

// export { migrateAddressesToEnhancedFormat, validateMigration };
