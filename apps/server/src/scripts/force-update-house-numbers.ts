// #!/usr/bin/env tsx

// /**
//  * Script to force update addresses with correct house numbers
//  * This script will regenerate HHG codes with the actual house numbers from the database
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
// }

// async function fetchAddresses(): Promise<AddressRecord[]> {
//   try {
//     console.log("📊 Fetching addresses from database...");

//     const result = await db.execute(sql`
//       SELECT
//         id, hhg_code, latitude, longitude, street, landmark, house_number,
//         state_code, lga_code
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
//     })) as AddressRecord[];

//     console.log(`📊 Found ${addresses.length} addresses to update`);
//     return addresses;
//   } catch (error) {
//     console.error("❌ Error fetching addresses:", error);
//     throw error;
//   }
// }

// async function updateAddressWithHouseNumber(
//   address: AddressRecord
// ): Promise<boolean> {
//   try {
//     // Normalize LGA code to 2 digits (remove state prefix and leading zeros)
//     const normalizedLgaCode = address.lgaCode
//       ? parseInt(address.lgaCode.replace(/^[A-Z]{2}/, ""), 10)
//           .toString()
//           .padStart(2, "0")
//       : undefined;

//     console.log(`🔄 Updating address ${address.id}:`);
//     console.log(`   Current: ${address.hhgCode}`);
//     console.log(`   House Number: ${address.houseNumber || "N/A"}`);

//     // Generate new HHG code with correct house number
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

//     // Parse the new code to verify it's correct
//     const parsed = parseDDC(newHhgCode);
//     if (!parsed) {
//       console.warn(
//         `⚠️  Could not parse new HHG code for address ${address.id}: ${newHhgCode}`
//       );
//       return false;
//     }

//     console.log(`   Parsed House: ${parsed.houseNumber || "N/A"}`);

//     // Update the address with new format
//     await db.execute(sql`
//       UPDATE addresses
//       SET
//         hhg_code = ${newHhgCode},
//         area_type = ${parsed.areaType},
//         area_code = ${parsed.areaCode},
//         location_number = ${parsed.locationNumber},
//         updated_at = NOW()
//       WHERE id = ${address.id}
//     `);

//     console.log(`   ✅ Updated successfully`);
//     return true;
//   } catch (error) {
//     console.error(`❌ Error updating address ${address.id}:`, error);
//     return false;
//   }
// }

// async function main() {
//   console.log("🏠 Force Updating Addresses with Correct House Numbers");
//   console.log(
//     "📝 This will regenerate HHG codes with actual house numbers from the database\n"
//   );

//   try {
//     // Fetch all addresses
//     const addresses = await fetchAddresses();

//     if (addresses.length === 0) {
//       console.log("✅ No addresses found to update");
//       return;
//     }

//     let updatedCount = 0;
//     let errorCount = 0;

//     console.log(`🔄 Processing ${addresses.length} addresses...\n`);

//     for (const address of addresses) {
//       try {
//         const success = await updateAddressWithHouseNumber(address);

//         if (success) {
//           updatedCount++;
//         } else {
//           errorCount++;
//         }

//         console.log(); // Add spacing between addresses

//         // Add small delay to avoid overwhelming the database
//         await new Promise((resolve) => setTimeout(resolve, 100));
//       } catch (error) {
//         console.error(`❌ Error processing address ${address.id}:`, error);
//         errorCount++;
//       }
//     }

//     console.log("📊 Update Summary:");
//     console.log(`✅ Successfully updated: ${updatedCount} addresses`);
//     console.log(`❌ Errors: ${errorCount} addresses`);
//     console.log(`📊 Total processed: ${addresses.length} addresses`);

//     if (errorCount > 0) {
//       console.log(
//         "\n⚠️  Some addresses failed to update. Check the logs above for details."
//       );
//     } else {
//       console.log(
//         "\n🎉 All addresses successfully updated with correct house numbers!"
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

// export { main as forceUpdateHouseNumbers };
