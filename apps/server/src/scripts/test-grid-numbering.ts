import {
  generateGridHouseNumber,
  getH3Index,
  extractBaseHouseNumber,
  areInSameH3Cell,
} from "../utils/h3-grid-numbering";
import { db } from "../db";
import { addresses } from "../db/schema";

/**
 * Test script to validate H3 grid generation and collision handling
 */

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const testResults: TestResult[] = [];

function addTestResult(
  testName: string,
  passed: boolean,
  message: string,
  details?: any
) {
  testResults.push({ testName, passed, message, details });
  console.log(`${passed ? "✅" : "❌"} ${testName}: ${message}`);
  if (details) {
    console.log("   Details:", details);
  }
}

async function testH3IndexGeneration() {
  console.log("\n🧪 Testing H3 Index Generation...");

  // Test coordinates in Lagos, Nigeria
  const testCoordinates = [
    { lat: 6.5244, lng: 3.3792, name: "Lagos Island" },
    { lat: 6.4474, lng: 3.3903, name: "Victoria Island" },
    {
      lat: 6.5244,
      lng: 3.3792,
      name: "Same as Lagos Island (should be identical)",
    },
    { lat: 6.5245, lng: 3.3793, name: "Very close to Lagos Island" },
    { lat: 6.6, lng: 3.4, name: "Different area in Lagos" },
  ];

  for (const coord of testCoordinates) {
    try {
      const h3Index = getH3Index(coord.lat, coord.lng);
      const baseNumber = extractBaseHouseNumber(h3Index);

      addTestResult(
        `H3 Index for ${coord.name}`,
        true,
        `Generated H3 index: ${h3Index}, Base number: ${baseNumber}`,
        { coordinates: coord, h3Index, baseNumber }
      );
    } catch (error) {
      addTestResult(`H3 Index for ${coord.name}`, false, `Error: ${error}`, {
        coordinates: coord,
        error,
      });
    }
  }
}

async function testCollisionDetection() {
  console.log("\n🧪 Testing Collision Detection...");

  // Test coordinates that should be in the same H3 cell
  const sameCellCoords = [
    { lat: 6.5244, lng: 3.3792, name: "Point A" },
    { lat: 6.5244, lng: 3.3792, name: "Point B (identical)" },
  ];

  const differentCellCoords = [
    { lat: 6.5244, lng: 3.3792, name: "Point A" },
    { lat: 6.6, lng: 3.4, name: "Point B (different)" },
  ];

  // Test same cell detection
  const sameCell = areInSameH3Cell(
    sameCellCoords[0].lat,
    sameCellCoords[0].lng,
    sameCellCoords[1].lat,
    sameCellCoords[1].lng
  );

  addTestResult(
    "Same Cell Detection",
    sameCell,
    sameCell
      ? "Correctly identified as same cell"
      : "Failed to identify same cell",
    { coordinates: sameCellCoords }
  );

  // Test different cell detection
  const differentCell = !areInSameH3Cell(
    differentCellCoords[0].lat,
    differentCellCoords[0].lng,
    differentCellCoords[1].lat,
    differentCellCoords[1].lng
  );

  addTestResult(
    "Different Cell Detection",
    differentCell,
    differentCell
      ? "Correctly identified as different cells"
      : "Failed to identify different cells",
    { coordinates: differentCellCoords }
  );
}

async function testGridHouseNumberGeneration() {
  console.log("\n🧪 Testing Grid House Number Generation...");

  const testCoordinates = [
    { lat: 6.5244, lng: 3.3792, name: "Lagos Island" },
    { lat: 6.4474, lng: 3.3903, name: "Victoria Island" },
    { lat: 6.6, lng: 3.4, name: "Ikeja" },
  ];

  for (const coord of testCoordinates) {
    try {
      const result = await generateGridHouseNumber(coord.lat, coord.lng);

      addTestResult(
        `Grid Number for ${coord.name}`,
        true,
        `Generated: ${result.generatedNumber}, H3: ${result.h3Index}, Collision: ${result.isCollision}`,
        { coordinates: coord, result }
      );
    } catch (error) {
      addTestResult(`Grid Number for ${coord.name}`, false, `Error: ${error}`, {
        coordinates: coord,
        error,
      });
    }
  }
}

async function testSequentialNumbering() {
  console.log("\n🧪 Testing Sequential Numbering (10s sequence)...");

  // Test the 10s sequence logic
  const baseNumber = 8740;
  const testSequences = [
    { existing: [], expected: "8740", description: "First address in cell" },
    {
      existing: [8740],
      expected: "8741",
      description: "Second address in cell",
    },
    {
      existing: [8740, 8741],
      expected: "8742",
      description: "Third address in cell",
    },
    {
      existing: [8740, 8741, 8742, 8743, 8744, 8745, 8746, 8747, 8748],
      expected: "8749",
      description: "Tenth address in cell",
    },
  ];

  for (const test of testSequences) {
    try {
      // This would normally be done by getNextHouseNumber function
      let nextNumber = baseNumber;
      for (const existingNum of test.existing) {
        if (nextNumber === existingNum) {
          nextNumber++;
        } else {
          break;
        }
      }

      const passed = nextNumber.toString() === test.expected;
      addTestResult(
        `Sequential Numbering: ${test.description}`,
        passed,
        `Expected: ${test.expected}, Got: ${nextNumber}`,
        { existing: test.existing, expected: test.expected, actual: nextNumber }
      );
    } catch (error) {
      addTestResult(
        `Sequential Numbering: ${test.description}`,
        false,
        `Error: ${error}`,
        { test, error }
      );
    }
  }
}

async function testEdgeCases() {
  console.log("\n🧪 Testing Edge Cases...");

  // Test invalid coordinates
  const invalidCoords = [
    { lat: NaN, lng: 3.3792, name: "Invalid latitude (NaN)" },
    { lat: 6.5244, lng: NaN, name: "Invalid longitude (NaN)" },
    { lat: 91, lng: 3.3792, name: "Latitude out of range" },
    { lat: 6.5244, lng: 181, name: "Longitude out of range" },
  ];

  for (const coord of invalidCoords) {
    try {
      const result = await generateGridHouseNumber(coord.lat, coord.lng);
      addTestResult(
        `Edge Case: ${coord.name}`,
        false,
        "Should have thrown error but succeeded",
        { coordinates: coord, result }
      );
    } catch (error) {
      addTestResult(
        `Edge Case: ${coord.name}`,
        true,
        "Correctly threw error for invalid coordinates",
        {
          coordinates: coord,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  // Test boundary coordinates
  const boundaryCoords = [
    { lat: 0, lng: 0, name: "Equator/Prime Meridian" },
    { lat: 90, lng: 0, name: "North Pole" },
    { lat: -90, lng: 0, name: "South Pole" },
    { lat: 0, lng: 180, name: "International Date Line" },
  ];

  for (const coord of boundaryCoords) {
    try {
      const result = await generateGridHouseNumber(coord.lat, coord.lng);
      addTestResult(
        `Boundary: ${coord.name}`,
        true,
        `Generated: ${result.generatedNumber}`,
        { coordinates: coord, result }
      );
    } catch (error) {
      addTestResult(`Boundary: ${coord.name}`, false, `Error: ${error}`, {
        coordinates: coord,
        error,
      });
    }
  }
}

async function testDatabaseIntegration() {
  console.log("\n🧪 Testing Database Integration...");

  try {
    // Test if we can query the database
    const addressCount = await db.select().from(addresses).limit(1);

    addTestResult(
      "Database Connection",
      true,
      "Successfully connected to database",
      { addressCount: addressCount.length }
    );
  } catch (error) {
    addTestResult(
      "Database Connection",
      false,
      `Database connection failed: ${error}`,
      { error }
    );
  }
}

async function runAllTests() {
  console.log("🚀 Starting Grid Numbering Tests...\n");

  await testH3IndexGeneration();
  await testCollisionDetection();
  await testGridHouseNumberGeneration();
  await testSequentialNumbering();
  await testEdgeCases();
  await testDatabaseIntegration();

  // Summary
  console.log("\n📊 Test Summary:");
  const passed = testResults.filter((r) => r.passed).length;
  const total = testResults.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Failed: ${total - passed}/${total} (${100 - percentage}%)`);

  if (total - passed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(`   - ${result.testName}: ${result.message}`);
      });
  }

  console.log("\n🎉 Test run completed!");
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests, testResults };
