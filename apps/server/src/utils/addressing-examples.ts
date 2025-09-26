/**
 * Comprehensive examples of the enhanced HHG code generation system
 * This file demonstrates all edge cases and scenarios for the new addressing system
 */

import { generateHhgCode, parseDDC } from "./addressing";

// --- Test Data for Various Scenarios ---

interface TestCase {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  streetName?: string;
  landmark?: string;
  houseNumber?: string;
  stateCode?: string;
  lgaCode?: string;
  expectedPattern?: string;
}

const testCases: TestCase[] = [
  // === LAGOS AREAS ===
  {
    name: "Victoria Island - Luxury Apartment",
    description: "High-end residential area with street name and house number",
    latitude: 6.4281,
    longitude: 3.4219,
    streetName: "Victoria Island",
    houseNumber: "42",
    stateCode: "LA",
    lgaCode: "15",
    expectedPattern: "NG-LA-15-VIC-*-****",
  },
  {
    name: "Ikoyi - Commercial Building",
    description: "Commercial area with street name and house number",
    latitude: 6.4489,
    longitude: 3.4258,
    streetName: "Ikoyi",
    houseNumber: "123",
    stateCode: "LA",
    lgaCode: "15",
    expectedPattern: "NG-LA-15-IKO-*-****",
  },
  {
    name: "Lekki - Residential Estate",
    description: "New residential development with estate name",
    latitude: 6.4698,
    longitude: 3.5852,
    streetName: "Lekki Phase 1",
    houseNumber: "15A",
    stateCode: "LA",
    lgaCode: "16",
    expectedPattern: "NG-LA-16-LEK-*-****",
  },
  {
    name: "Surulere - Street Address",
    description: "Traditional residential area with street name",
    latitude: 6.5018,
    longitude: 3.3581,
    streetName: "Surulere",
    houseNumber: "25",
    stateCode: "LA",
    lgaCode: "14",
    expectedPattern: "NG-LA-14-SUR-*-****",
  },
  {
    name: "Yaba - University Area",
    description: "Educational district with street name",
    latitude: 6.5095,
    longitude: 3.3711,
    streetName: "Yaba",
    houseNumber: "8",
    stateCode: "LA",
    lgaCode: "13",
    expectedPattern: "NG-LA-13-YAB-*-****",
  },

  // === ABUJA AREAS ===
  {
    name: "Asokoro - Diplomatic Area",
    description: "High-end diplomatic residential area",
    latitude: 9.0765,
    longitude: 7.3986,
    streetName: "Asokoro",
    houseNumber: "10",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-ASO-*-****",
  },
  {
    name: "Maitama - Government Residential",
    description: "Government residential area",
    latitude: 9.0765,
    longitude: 7.3986,
    streetName: "Maitama",
    houseNumber: "5",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-MAI-*-****",
  },
  {
    name: "Wuse - Commercial District",
    description: "Commercial and business district",
    latitude: 9.0565,
    longitude: 7.4786,
    streetName: "Wuse 2",
    houseNumber: "100",
    stateCode: "FC",
    lgaCode: "02",
    expectedPattern: "NG-FC-02-WUS-*-****",
  },
  {
    name: "Garki - CBD Area",
    description: "Central Business District",
    latitude: 9.0565,
    longitude: 7.4786,
    streetName: "Central Business District",
    houseNumber: "50",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-CBD-*-****",
  },

  // === KANO AREAS ===
  {
    name: "Nassarawa - Traditional Area",
    description: "Traditional residential area",
    latitude: 12.0022,
    longitude: 8.592,
    streetName: "Nassarawa",
    houseNumber: "30",
    stateCode: "KN",
    lgaCode: "08",
    expectedPattern: "NG-KN-08-NAS-*-****",
  },
  {
    name: "Fagge - Commercial Area",
    description: "Commercial and market area",
    latitude: 12.0022,
    longitude: 8.592,
    streetName: "Fagge",
    houseNumber: "75",
    stateCode: "KN",
    lgaCode: "08",
    expectedPattern: "NG-KN-08-FAG-*-****",
  },

  // === PORT HARCOURT AREAS ===
  {
    name: "GRA - Government Reserved Area",
    description: "High-end residential area",
    latitude: 4.8156,
    longitude: 7.0498,
    streetName: "G.R.A",
    houseNumber: "20",
    stateCode: "RI",
    lgaCode: "01",
    expectedPattern: "NG-RI-01-GRA-*-****",
  },
  {
    name: "Diobu - Residential Area",
    description: "Mixed residential and commercial area",
    latitude: 4.8156,
    longitude: 7.0498,
    streetName: "Diobu",
    houseNumber: "45",
    stateCode: "RI",
    lgaCode: "01",
    expectedPattern: "NG-RI-01-DIO-*-****",
  },

  // === LANDMARK-BASED ADDRESSES ===
  {
    name: "Hospital Area - Lagos",
    description: "Address near a major hospital",
    latitude: 6.5244,
    longitude: 3.3792,
    landmark: "Lagos University Teaching Hospital",
    houseNumber: "12",
    stateCode: "LA",
    lgaCode: "15",
    expectedPattern: "NG-LA-15-HOS-*-****",
  },
  {
    name: "School Area - Abuja",
    description: "Address near a school",
    latitude: 9.0765,
    longitude: 7.3986,
    landmark: "University of Abuja",
    houseNumber: "7",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-UNI-*-****",
  },
  {
    name: "Market Area - Kano",
    description: "Address near a major market",
    latitude: 12.0022,
    longitude: 8.592,
    landmark: "Kano Central Market",
    houseNumber: "33",
    stateCode: "KN",
    lgaCode: "08",
    expectedPattern: "NG-KN-08-MAR-*-****",
  },
  {
    name: "Bank Area - Port Harcourt",
    description: "Address near banking district",
    latitude: 4.8156,
    longitude: 7.0498,
    landmark: "First Bank",
    houseNumber: "18",
    stateCode: "RI",
    lgaCode: "01",
    expectedPattern: "NG-RI-01-BAN-*-****",
  },

  // === GENERIC STREET TYPES ===
  {
    name: "Generic Street - Lagos",
    description: "Address with generic street type",
    latitude: 6.5244,
    longitude: 3.3792,
    streetName: "Broad Street",
    houseNumber: "200",
    stateCode: "LA",
    lgaCode: "15",
    expectedPattern: "NG-LA-15-STR-*-****",
  },
  {
    name: "Generic Road - Abuja",
    description: "Address with generic road type",
    latitude: 9.0765,
    longitude: 7.3986,
    streetName: "Independence Avenue",
    houseNumber: "150",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-ROA-*-****",
  },
  {
    name: "Generic Avenue - Kano",
    description: "Address with generic avenue type",
    latitude: 12.0022,
    longitude: 8.592,
    streetName: "Murtala Mohammed Way",
    houseNumber: "88",
    stateCode: "KN",
    lgaCode: "08",
    expectedPattern: "NG-KN-08-AVE-*-****",
  },

  // === ESTATE AND COMPOUND ADDRESSES ===
  {
    name: "Estate Address - Lagos",
    description: "Address within a housing estate",
    latitude: 6.5244,
    longitude: 3.3792,
    streetName: "Victoria Garden City Estate",
    houseNumber: "Block 5, Flat 12",
    stateCode: "LA",
    lgaCode: "16",
    expectedPattern: "NG-LA-16-EST-*-****",
  },
  {
    name: "Compound Address - Abuja",
    description: "Address within a compound",
    latitude: 9.0765,
    longitude: 7.3986,
    streetName: "Family Compound",
    houseNumber: "Unit 3",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-COM-*-****",
  },

  // === RURAL AREAS (NO STREET NAME) ===
  {
    name: "Rural Area - Lagos",
    description: "Rural area without street name",
    latitude: 6.5244,
    longitude: 3.3792,
    landmark: "Near the big tree",
    stateCode: "LA",
    lgaCode: "20",
    expectedPattern: "NG-LA-20-LMK-*-****",
  },
  {
    name: "Rural Area - Abuja",
    description: "Rural area with only coordinates",
    latitude: 9.0765,
    longitude: 7.3986,
    stateCode: "FC",
    lgaCode: "05",
    expectedPattern: "NG-FC-05-Z01-*-****",
  },

  // === EDGE CASES ===
  {
    name: "No House Number - Lagos",
    description: "Address without house number",
    latitude: 6.5244,
    longitude: 3.3792,
    streetName: "Victoria Island",
    stateCode: "LA",
    lgaCode: "15",
    expectedPattern: "NG-LA-15-VIC-*-****",
  },
  {
    name: "Complex House Number - Abuja",
    description: "Address with complex house number format",
    latitude: 9.0765,
    longitude: 7.3986,
    streetName: "Asokoro",
    houseNumber: "123A/456B",
    stateCode: "FC",
    lgaCode: "01",
    expectedPattern: "NG-FC-01-ASO-*-****",
  },
  {
    name: "Empty Street Name - Kano",
    description: "Address with empty street name",
    latitude: 12.0022,
    longitude: 8.592,
    streetName: "",
    landmark: "Near the mosque",
    houseNumber: "15",
    stateCode: "KN",
    lgaCode: "08",
    expectedPattern: "NG-KN-08-MOS-*-****",
  },
  {
    name: "Special Characters in Street - Port Harcourt",
    description: "Address with special characters in street name",
    latitude: 4.8156,
    longitude: 7.0498,
    streetName: "Rumuokoro-Rumuola Road",
    houseNumber: "99",
    stateCode: "RI",
    lgaCode: "01",
    expectedPattern: "NG-RI-01-RUM-*-****",
  },

  // === COORDINATE-BASED FALLBACKS ===
  {
    name: "Unknown Area - Northern Nigeria",
    description: "Area not in mapping, should use coordinate-based zone",
    latitude: 11.0,
    longitude: 8.0,
    streetName: "Unknown Street",
    stateCode: "KD",
    lgaCode: "01",
    expectedPattern: "NG-KD-01-Z01-*-****",
  },
  {
    name: "Unknown Area - Southern Nigeria",
    description: "Area not in mapping, should use coordinate-based landmark",
    latitude: 8.0,
    longitude: 5.0,
    streetName: "Unknown Street",
    stateCode: "ED",
    lgaCode: "01",
    expectedPattern: "NG-ED-01-LMK-*-****",
  },
  {
    name: "Unknown Area - Coastal Nigeria",
    description: "Area not in mapping, should use coordinate-based street",
    latitude: 5.0,
    longitude: 6.0,
    streetName: "Unknown Street",
    stateCode: "CR",
    lgaCode: "01",
    expectedPattern: "NG-CR-01-STR-*-****",
  },
];

/**
 * Runs all test cases and generates example codes
 */
export async function runAddressingExamples(): Promise<void> {
  console.log("🏠 Enhanced HHG Code Generation Examples\n");
  console.log("=".repeat(80));

  for (const testCase of testCases) {
    try {
      const hhgCode = await generateHhgCode(
        testCase.latitude,
        testCase.longitude,
        testCase.streetName,
        testCase.landmark,
        testCase.houseNumber,
        testCase.stateCode,
        testCase.lgaCode
      );

      if (hhgCode) {
        const parsed = parseDDC(hhgCode);

        console.log(`\n📍 ${testCase.name}`);
        console.log(`   Description: ${testCase.description}`);
        console.log(
          `   Input: ${testCase.streetName || "N/A"} | ${
            testCase.landmark || "N/A"
          } | ${testCase.houseNumber || "N/A"}`
        );
        console.log(
          `   Coordinates: ${testCase.latitude}, ${testCase.longitude}`
        );
        console.log(`   Generated Code: ${hhgCode}`);

        if (parsed) {
          console.log(
            `   Parsed: State=${parsed.stateCode}, LGA=${
              parsed.lgaCode
            }, Area=${parsed.areaCode}, Type=${parsed.areaType}, House=${
              parsed.houseNumber || "N/A"
            }, Location=${parsed.locationNumber}`
          );
        }

        if (testCase.expectedPattern) {
          const matches = hhgCode.match(
            new RegExp(testCase.expectedPattern.replace(/\*/g, ".*"))
          );
          console.log(`   ✅ Pattern Match: ${matches ? "PASS" : "FAIL"}`);
        }
      } else {
        console.log(`\n❌ ${testCase.name} - FAILED TO GENERATE CODE`);
      }
    } catch (error) {
      console.log(`\n💥 ${testCase.name} - ERROR: ${error}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ All examples completed!");
}

/**
 * Demonstrates the enhanced format breakdown
 */
export function demonstrateFormatBreakdown(): void {
  console.log("\n🔍 Enhanced HHG Code Format Breakdown");
  console.log("=".repeat(50));
  console.log("Format: NG-XX-YY-ZZZ-GG-NNNN");
  console.log("");
  console.log("NG     = Country code (Nigeria)");
  console.log("XX     = State code (2 letters) - LA, FC, KN, RI, etc.");
  console.log("YY     = LGA code (2 digits) - 01, 15, 08, etc.");
  console.log("ZZZ    = Area identifier (3 chars) - VIC, ASO, HOS, STR, etc.");
  console.log("GG     = Grid code (2 chars) - A1, B3, C2, etc. (base-36)");
  console.log(
    "NNNN   = Location number (4 digits) - incorporates house number"
  );
  console.log("");
  console.log("Area Types:");
  console.log("  STREET    = Named streets/areas (VIC, IKO, LEK, etc.)");
  console.log("  LANDMARK  = Landmark-based (HOS, SCH, MAR, etc.)");
  console.log("  ZONE      = Coordinate-based zones (Z01, Z02, etc.)");
  console.log("");
  console.log("Grid System:");
  console.log("  - 10x10 grid based on coordinate fractional parts");
  console.log("  - House number modifies grid position");
  console.log("  - Encoded in base-36 for compact representation");
  console.log("");
  console.log("Location Number:");
  console.log("  - Based on coordinate fractional parts");
  console.log("  - House number modifies last two digits");
  console.log("  - Ensures uniqueness within grid cell");
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAddressingExamples()
    .then(() => demonstrateFormatBreakdown())
    .catch(console.error);
}
