import {
  generateRuralAddressComponents,
  generateLandmarkBasedAddress,
  generateDirectionBasedAddress,
  generateVillageAreaAddress,
  generateCoordinateDescription,
  parseRuralAddressInput,
} from "../utils/rural-addressing";

// Test coordinates for different Nigerian locations
const testLocations = [
  {
    name: "Rural Lagos",
    latitude: 6.5244,
    longitude: 3.3792,
    city: "Ikorodu",
  },
  {
    name: "Rural Kano",
    latitude: 11.8037,
    longitude: 8.5209,
    city: "Gwarzo",
  },
  {
    name: "Rural FCT",
    latitude: 9.0765,
    longitude: 7.3986,
    city: "Kwali",
  },
  {
    name: "Rural Rivers",
    latitude: 4.8156,
    longitude: 6.9778,
    city: "Omoku",
  },
];

async function testRuralAddressing() {
  console.log("🌾 Testing Rural Addressing System\n");

  for (const location of testLocations) {
    console.log(`📍 Testing: ${location.name} (${location.city})`);
    console.log(`Coordinates: ${location.latitude}, ${location.longitude}\n`);

    // Test 1: Basic coordinate description
    console.log("1️⃣ Coordinate Description:");
    const coordDesc = generateCoordinateDescription(
      location.latitude,
      location.longitude,
      location.city
    );
    console.log(`   ${coordDesc}\n`);

    // Test 2: Landmark-based address
    console.log("2️⃣ Landmark-based Address:");
    const landmarkAddr = generateLandmarkBasedAddress({
      primaryLandmark: `${location.city} Primary School`,
      direction: "North",
      distance: "500m",
      description: "near the old water tower",
    });
    console.log(`   ${landmarkAddr}\n`);

    // Test 3: Direction-based address
    console.log("3️⃣ Direction-based Address:");
    const directionAddr = generateDirectionBasedAddress({
      referencePoint: `${location.city} Market`,
      direction: "East",
      distance: "2km",
      additionalInfo: "follow the dirt road",
    });
    console.log(`   ${directionAddr}\n`);

    // Test 4: Village area address
    console.log("4️⃣ Village Area Address:");
    const villageAddr = generateVillageAreaAddress({
      village: location.city,
      area: "Farmlands",
      quarter: "Northern",
      familyName: "Musa",
      localName: "Behind the big baobab tree",
    });
    console.log(`   ${villageAddr}\n`);

    // Test 5: Parse rural address input
    console.log("5️⃣ Address Input Parsing:");
    const sampleInputs = [
      "Near the big mosque in the village center",
      "5km north of the main market",
      "Sabon Gari settlement area",
      "Gidan Malam Ahmed compound",
    ];

    sampleInputs.forEach((input, index) => {
      const parsed = parseRuralAddressInput(input);
      console.log(`   Input ${index + 1}: "${input}"`);
      console.log(
        `   Type: ${parsed.type}, Confidence: ${parsed.confidence}\n`
      );
    });

    // Test 6: Complete rural address generation
    console.log("6️⃣ Complete Rural Address Components:");
    try {
      const ruralComponents = await generateRuralAddressComponents(
        location.latitude,
        location.longitude,
        location.city,
        "Near the community health center"
      );

      console.log(`   Primary: ${ruralComponents.primaryAddress}`);
      console.log(`   Alternatives:`);
      ruralComponents.alternativeAddresses.forEach((alt, i) => {
        console.log(`     ${i + 1}. ${alt}`);
      });

      console.log(
        `   Landmark Suggestions: ${ruralComponents.suggestedComponents.landmarks
          .slice(0, 5)
          .join(", ")}`
      );
      console.log(
        `   Traditional Names: ${ruralComponents.suggestedComponents.traditional
          .slice(0, 3)
          .join(", ")}`
      );
    } catch (error) {
      console.log(`   Error: ${error}`);
    }

    console.log("\n" + "=".repeat(80) + "\n");
  }
}

// Test different rural scenarios
async function testRuralScenarios() {
  console.log("🎯 Testing Specific Rural Scenarios\n");

  const scenarios = [
    {
      name: "Complete Unknown Location",
      description: "User has no street address, only GPS coordinates",
      latitude: 7.2345,
      longitude: 4.5678,
      city: "Remote Village",
      userInput: undefined,
    },
    {
      name: "Landmark Reference",
      description: "User knows prominent local landmark",
      latitude: 9.1234,
      longitude: 6.789,
      city: "Pastoral Settlement",
      userInput: "Near the old baobab tree where cattle drink",
    },
    {
      name: "Traditional Naming",
      description: "User uses traditional area names",
      latitude: 11.5678,
      longitude: 8.9012,
      city: "Gwarzo",
      userInput: "Unguwar Magaji, close to Sarki's compound",
    },
    {
      name: "Distance from Known Point",
      description: "User gives direction and distance",
      latitude: 6.789,
      longitude: 3.4567,
      city: "Ibafo",
      userInput: "About 3km southwest of the main motor park",
    },
  ];

  for (const scenario of scenarios) {
    console.log(`📝 Scenario: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log(`User Input: ${scenario.userInput || "None"}\n`);

    try {
      const result = await generateRuralAddressComponents(
        scenario.latitude,
        scenario.longitude,
        scenario.city,
        scenario.userInput
      );

      console.log(`✅ Generated Primary Address:`);
      console.log(`   ${result.primaryAddress}\n`);

      console.log(`📋 Alternative Options:`);
      result.alternativeAddresses.forEach((alt, i) => {
        console.log(`   ${i + 1}. ${alt}`);
      });

      console.log(`\n🎯 Coordinate Reference:`);
      console.log(`   ${result.coordinateDescription}\n`);
    } catch (error) {
      console.log(`❌ Error: ${error}\n`);
    }

    console.log("-".repeat(60) + "\n");
  }
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting Rural Addressing Tests\n");
  console.log("=".repeat(80) + "\n");

  try {
    await testRuralAddressing();
    await testRuralScenarios();

    console.log("✅ All tests completed successfully!");
    console.log("\n💡 Key Benefits of Rural Addressing System:");
    console.log("   • Handles areas without street names");
    console.log("   • Provides multiple fallback options");
    console.log("   • Uses familiar landmarks and directions");
    console.log("   • Incorporates traditional Nigerian naming");
    console.log("   • Always includes precise GPS coordinates");
    console.log("   • Suggests common rural reference points");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { testRuralAddressing, testRuralScenarios, runTests };
