// /**
//  * Test script to demonstrate address migration without database access
//  * This shows how existing addresses would be converted to the new format
//  */

// import { generateHhgCode, parseDDC } from "../utils/addressing";

// interface TestAddress {
//   id: number;
//   oldHhgCode: string;
//   latitude: number;
//   longitude: number;
//   street?: string;
//   landmark?: string;
//   houseNumber?: string;
//   stateCode?: string;
//   lgaCode?: string;
// }

// // Sample existing addresses in old format
// const testAddresses: TestAddress[] = [
//   {
//     id: 1,
//     oldHhgCode: "NG-LA-001-STR001-4757",
//     latitude: 6.4281,
//     longitude: 3.4219,
//     street: "Victoria Island",
//     houseNumber: "42",
//     stateCode: "LA",
//     lgaCode: "15",
//   },
//   {
//     id: 2,
//     oldHhgCode: "NG-FC-001-LMK001-1234",
//     latitude: 9.0765,
//     longitude: 7.3986,
//     landmark: "Lagos University Teaching Hospital",
//     houseNumber: "12",
//     stateCode: "FC",
//     lgaCode: "01",
//   },
//   {
//     id: 3,
//     oldHhgCode: "NG-KN-001-Z001-5678",
//     latitude: 12.0022,
//     longitude: 8.592,
//     street: "Unknown Street",
//     stateCode: "KN",
//     lgaCode: "08",
//   },
//   {
//     id: 4,
//     oldHhgCode: "NG-RI-001-STR001-9999",
//     latitude: 4.8156,
//     longitude: 7.0498,
//     street: "G.R.A",
//     houseNumber: "20",
//     stateCode: "RI",
//     lgaCode: "01",
//   },
//   {
//     id: 5,
//     oldHhgCode: "NG-LA-001-STR001-0001",
//     latitude: 6.5244,
//     longitude: 3.3792,
//     street: "Broad Street",
//     houseNumber: "200",
//     stateCode: "LA",
//     lgaCode: "15",
//   },
//   {
//     id: 6,
//     oldHhgCode: "NG-FC-001-LMK001-5555",
//     latitude: 9.0565,
//     longitude: 7.4786,
//     landmark: "University of Abuja",
//     houseNumber: "7",
//     stateCode: "FC",
//     lgaCode: "01",
//   },
//   {
//     id: 7,
//     oldHhgCode: "NG-LA-001-STR001-7777",
//     latitude: 6.5018,
//     longitude: 3.3581,
//     street: "Surulere",
//     houseNumber: "25",
//     stateCode: "LA",
//     lgaCode: "14",
//   },
//   {
//     id: 8,
//     oldHhgCode: "NG-KN-001-STR001-8888",
//     latitude: 12.0022,
//     longitude: 8.592,
//     street: "Nassarawa",
//     houseNumber: "30",
//     stateCode: "KN",
//     lgaCode: "08",
//   },
//   {
//     id: 9,
//     oldHhgCode: "NG-RI-001-LMK001-3333",
//     latitude: 4.8156,
//     longitude: 7.0498,
//     landmark: "First Bank",
//     houseNumber: "18",
//     stateCode: "RI",
//     lgaCode: "01",
//   },
//   {
//     id: 10,
//     oldHhgCode: "NG-LA-001-STR001-1111",
//     latitude: 6.5095,
//     longitude: 3.3711,
//     street: "Yaba",
//     houseNumber: "8",
//     stateCode: "LA",
//     lgaCode: "13",
//   },
// ];

// /**
//  * Tests the migration of a single address
//  */
// async function testAddressMigration(address: TestAddress): Promise<{
//   success: boolean;
//   oldCode: string;
//   newCode: string | null;
//   parsed: any;
//   error?: string;
// }> {
//   try {
//     // Generate new enhanced HHG code
//     const newHhgCode = await generateHhgCode(
//       address.latitude,
//       address.longitude,
//       address.street,
//       address.landmark,
//       address.houseNumber,
//       address.stateCode,
//       address.lgaCode
//     );

//     if (!newHhgCode) {
//       return {
//         success: false,
//         oldCode: address.oldHhgCode,
//         newCode: null,
//         parsed: null,
//         error: "Failed to generate new HHG code",
//       };
//     }

//     // Parse the new code
//     const parsed = parseDDC(newHhgCode);

//     return {
//       success: true,
//       oldCode: address.oldHhgCode,
//       newCode: newHhgCode,
//       parsed,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       oldCode: address.oldHhgCode,
//       newCode: null,
//       parsed: null,
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }

// /**
//  * Main test function
//  */
// async function runMigrationTest(): Promise<void> {
//   console.log("🧪 Testing Address Migration to Enhanced Format");
//   console.log("=".repeat(70));
//   console.log("This demonstrates how existing addresses would be converted");
//   console.log("from the old format to the new enhanced format.\n");

//   let successCount = 0;
//   let errorCount = 0;

//   for (const address of testAddresses) {
//     const result = await testAddressMigration(address);

//     console.log(`📍 Address ID ${address.id}:`);
//     console.log(
//       `   Input: ${address.street || "N/A"} | ${address.landmark || "N/A"} | ${
//         address.houseNumber || "N/A"
//       }`
//     );
//     console.log(`   Coords: ${address.latitude}, ${address.longitude}`);
//     console.log(`   Old:    ${result.oldCode}`);

//     if (result.success) {
//       console.log(`   New:    ${result.newCode}`);
//       if (result.parsed) {
//         console.log(
//           `   Parsed: State=${result.parsed.stateCode}, LGA=${result.parsed.lgaCode}, Area=${result.parsed.areaCode}, Type=${result.parsed.areaType}, Grid=${result.parsed.gridCode}, Location=${result.parsed.locationNumber}`
//         );
//       }
//       successCount++;
//     } else {
//       console.log(`   Error:  ${result.error}`);
//       errorCount++;
//     }
//     console.log();
//   }

//   console.log("=".repeat(70));
//   console.log("📊 Migration Test Summary:");
//   console.log(`   ✅ Successful conversions: ${successCount}`);
//   console.log(`   ❌ Failed conversions: ${errorCount}`);
//   console.log(`   📋 Total tested: ${testAddresses.length}`);

//   if (successCount > 0) {
//     console.log("\n🎉 Migration test completed successfully!");
//     console.log("The enhanced format provides more meaningful area codes");
//     console.log("and better location precision with grid codes.");
//   } else {
//     console.log("\n💥 Migration test failed!");
//     console.log("Please check the error messages above.");
//   }
// }

// /**
//  * Shows format comparison
//  */
// function showFormatComparison(): void {
//   console.log("\n🔍 Format Comparison:");
//   console.log("-".repeat(50));
//   console.log("Old Format: NG-XX-YY-ZZZ-NNNN");
//   console.log("  Example:  NG-LA-001-STR001-4757");
//   console.log("  Parts:    Country-State-LGA-Area-Location");
//   console.log();
//   console.log("New Format: NG-XX-YY-ZZZ-GG-NNNN");
//   console.log("  Example:  NG-LA-15-VIC-CA-4284");
//   console.log("  Parts:    Country-State-LGA-Area-Grid-Location");
//   console.log();
//   console.log("Improvements:");
//   console.log("  • Meaningful area codes (VIC vs STR001)");
//   console.log("  • Grid system for precise location");
//   console.log("  • House number integration");
//   console.log("  • Better spatial organization");
// }

// // Run test if this file is executed directly
// if (require.main === module) {
//   runMigrationTest()
//     .then(() => showFormatComparison())
//     .catch((error) => {
//       console.error("Test failed:", error);
//       process.exit(1);
//     });
// }

// export { runMigrationTest, showFormatComparison };
