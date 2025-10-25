// #!/usr/bin/env tsx

// /**
//  * Script to update existing addresses to the new simplified HHG format
//  *
//  * New format: NG-XX-YY-ZZZ-HHHH-NNNN
//  * - Removes grid_code field (no longer needed)
//  * - Uses flexible street number length (1-5 digits)
//  * - Shorter, cleaner format
//  */

// import { db } from "../db";
// import { generateHhgCode, parseDDC } from "../utils/addressing";
// import { sql } from "drizzle-orm";

// interface AddressRecord {
//   id: number;
//   hhgCode: string;
//   latitude: string;
//   longitude: string;
//   street?: string;
//   landmark?: string;
//   houseNumber?: string;
//   stateCode?: string;
//   lgaCode?: string;
//   areaType?: string;
//   areaCode?: string;
//   locationNumber?: string;
//   gridCode?: string;
// }

// async function fetchAddresses(): Promise<AddressRecord[]> {
//   try {
//     console.log("📊 Fetching addresses from database...");

//     const result = await db.execute(sql`
//       SELECT
//         id, hhg_code, latitude, longitude, street, landmark, house_number,
//         state_code, lga_code, area_type, area_code, location_number, grid_code
//       FROM addresses
//       WHERE hhg_code IS NOT NULL
//       ORDER BY id
//     `);

//     // Map the database fields to our interface
//     const addresses = result.rows.map((row: any) => ({
//       id: row.id,
//       hhgCode: row.hhg_code,
//       latitude: row.latitude,
//       longitude: row.longitude,
//       street: row.street,
//       landmark: row.landmark,
//       houseNumber: row.house_number,
//       stateCode: row.state_code,
//       lgaCode: row.lga_code,
//       areaType: row.area_type,
//       areaCode: row.area_code,
//       locationNumber: row.location_number,
//       gridCode: row.grid_code,
//     })) as AddressRecord[];
//     console.log(`📊 Found ${addresses.length} addresses to update`);

//     return addresses;
//   } catch (error) {
//     console.error("❌ Error fetching addresses:", error);
//     throw error;
//   }
// }

// async function updateAddressToSimplifiedFormat(
//   address: AddressRecord
// ): Promise<boolean> {
//   try {
//     // Normalize LGA code to 2 digits (remove leading zeros)
//     const normalizedLgaCode = address.lgaCode
//       ? parseInt(address.lgaCode, 10).toString().padStart(2, "0")
//       : undefined;

//     // Generate new HHG code with simplified format
//     const newHhgCode = await generateHhgCode(
//       parseFloat(address.latitude),
//       parseFloat(address.longitude),
//       address.street || undefined,
//       address.landmark || undefined,
//       address.houseNumber || undefined,
//       address.stateCode || undefined,
//       normalizedLgaCode
//     );

//     if (!newHhgCode) {
//       console.warn(
//         `⚠️  Could not generate new HHG code for address ${address.id}`
//       );
//       return false;
//     }

//     console.log(`   Generated: ${newHhgCode}`);

//     // Parse the new code to get components
//     const parsed = parseDDC(newHhgCode);
//     if (!parsed) {
//       console.warn(
//         `⚠️  Could not parse new HHG code for address ${address.id}: ${newHhgCode}`
//       );
//       return false;
//     }

//     // Update the address with new format
//     await db.execute(sql`
//       UPDATE addresses
//       SET
//         hhg_code = ${newHhgCode},
//         area_type = ${parsed.areaType},
//         area_code = ${parsed.areaCode},
//         location_number = ${parsed.locationNumber},
//         grid_code = NULL,
//         updated_at = NOW()
//       WHERE id = ${address.id}
//     `);

//     return true;
//   } catch (error) {
//     console.error(`❌ Error updating address ${address.id}:`, error);
//     return false;
//   }
// }

// async function validateAddressFormat(address: AddressRecord): Promise<boolean> {
//   try {
//     // Check if address is already in new format
//     const newFormatRegex =
//       /^NG-([A-Z]{2})-(\d{2})-([A-Z0-9]{3})-(\d{1,5})-(\d{4})$/;
//     return newFormatRegex.test(address.hhgCode);
//   } catch (error) {
//     console.error(`❌ Error validating address ${address.id}:`, error);
//     return false;
//   }
// }

// async function main() {
//   console.log("🚀 Starting address format update to simplified HHG format");
//   console.log("📝 New format: NG-XX-YY-ZZZ-HHHH-NNNN");
//   console.log(
//     "📝 Removes grid_code field and uses flexible street number length\n"
//   );

//   try {
//     // Fetch all addresses
//     const addresses = await fetchAddresses();

//     if (addresses.length === 0) {
//       console.log("✅ No addresses found to update");
//       return;
//     }

//     let updatedCount = 0;
//     let skippedCount = 0;
//     let errorCount = 0;

//     console.log(`🔄 Processing ${addresses.length} addresses...\n`);

//     for (const address of addresses) {
//       try {
//         // Check if already in new format
//         const isNewFormat = await validateAddressFormat(address);

//         if (isNewFormat) {
//           console.log(
//             `⏭️  Address ${address.id} already in new format: ${address.hhgCode}`
//           );
//           skippedCount++;
//           continue;
//         }

//         console.log(`🔄 Updating address ${address.id}: ${address.hhgCode}`);
//         console.log(`   House number: ${address.houseNumber || "N/A"}`);

//         const success = await updateAddressToSimplifiedFormat(address);

//         if (success) {
//           console.log(`✅ Updated address ${address.id}`);
//           updatedCount++;
//         } else {
//           console.log(`❌ Failed to update address ${address.id}`);
//           errorCount++;
//         }

//         // Add small delay to avoid overwhelming the database
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       } catch (error) {
//         console.error(`❌ Error processing address ${address.id}:`, error);
//         errorCount++;
//       }
//     }

//     console.log("\n📊 Update Summary:");
//     console.log(`✅ Successfully updated: ${updatedCount} addresses`);
//     console.log(`⏭️  Skipped (already new format): ${skippedCount} addresses`);
//     console.log(`❌ Errors: ${errorCount} addresses`);
//     console.log(`📊 Total processed: ${addresses.length} addresses`);

//     if (errorCount > 0) {
//       console.log(
//         "\n⚠️  Some addresses failed to update. Check the logs above for details."
//       );
//     } else {
//       console.log(
//         "\n🎉 All addresses successfully updated to simplified format!"
//       );
//     }
//   } catch (error) {
//     console.error("❌ Fatal error during update process:", error);
//     process.exit(1);
//   }
// }

// // Run the script
// if (require.main === module) {
//   main()
//     .then(() => {
//       console.log("\n✅ Script completed successfully");
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error("\n❌ Script failed:", error);
//       process.exit(1);
//     });
// }

// export { main as updateAddressesToSimplifiedFormat };
