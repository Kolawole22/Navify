import {
  createPersonalCode,
  parsePersonalCode,
  formatPersonalCodeForDisplay,
} from "../utils/personalCodeGenerator";

// Test the new 8-digit personal code format
console.log("🧪 Testing New 8-Digit Personal Code Format\n");

// Test data
const testUser = {
  id: "test-user-123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "+2348000000000",
};

const testAddress = {
  latitude: "6.5244",
  longitude: "3.3792",
  stateCode: "LA",
  lgaCode: "001",
  city: "Lagos",
  street: "Victoria Island",
  houseNumber: "123",
};

// Generate personal code
const personalCode = createPersonalCode(testUser, testAddress);
console.log("Generated Personal Code:", personalCode);

// Parse the personal code
const parsed = parsePersonalCode(personalCode);
console.log("\nParsed Information:");
console.log("- Valid:", parsed.isValid);
console.log("- Letters:", parsed.letters?.join(", "));
console.log("- Numbers:", parsed.numbers?.join(", "));

// Format for display
const display = formatPersonalCodeForDisplay(personalCode);
console.log("\nDisplay Format:");
console.log("- Code:", display.code);
console.log("- Readable Info:", display.readableInfo);
console.log("- Valid:", display.isValid);

// Test with different users to ensure uniqueness
console.log("\n" + "=".repeat(50));
console.log("Testing with different users:\n");

const testCases = [
  {
    user: {
      id: "user1",
      firstName: "Adebayo",
      lastName: "Ogunlesi",
      email: "ade@test.com",
      phoneNumber: "+2348000000001",
    },
    address: {
      latitude: "6.5244",
      longitude: "3.3792",
      stateCode: "LA",
      lgaCode: "001",
      city: "Lagos",
      street: "Victoria Island",
      houseNumber: "123",
    },
  },
  {
    user: {
      id: "user2",
      firstName: "Fatima",
      lastName: "Ahmed",
      email: "fatima@test.com",
      phoneNumber: "+2348000000002",
    },
    address: {
      latitude: "9.0765",
      longitude: "7.3986",
      stateCode: "FC",
      lgaCode: "001",
      city: "Abuja",
      street: "Asokoro",
      houseNumber: "456",
    },
  },
  {
    user: {
      id: "user3",
      firstName: "Chinedu",
      lastName: "Nwosu",
      email: "chinedu@test.com",
      phoneNumber: "+2348000000003",
    },
    address: {
      latitude: "6.4474",
      longitude: "3.3903",
      stateCode: "LA",
      lgaCode: "002",
      city: "Lagos",
      street: "Ikoyi",
      houseNumber: "789",
    },
  },
];

testCases.forEach((testCase, index) => {
  const code = createPersonalCode(testCase.user, testCase.address);
  const parsed = parsePersonalCode(code);
  const display = formatPersonalCodeForDisplay(code);

  console.log(`Test Case ${index + 1}:`);
  console.log(`- User: ${testCase.user.firstName} ${testCase.user.lastName}`);
  console.log(`- Code: ${code}`);
  console.log(`- Letters: ${parsed.letters?.join(", ")}`);
  console.log(`- Numbers: ${parsed.numbers?.join(", ")}`);
  console.log(`- Valid: ${display.isValid}`);
  console.log("");
});

// Test validation with invalid codes
console.log("=".repeat(50));
console.log("Testing validation with invalid codes:\n");

const invalidCodes = [
  "ABC123", // Too short
  "ABCDEFGH", // No numbers
  "12345678", // No letters
  "ABCD123", // Only 3 numbers
  "ABC12345", // Only 3 letters
  "ABCD!234", // Invalid character
];

invalidCodes.forEach((code, index) => {
  const parsed = parsePersonalCode(code);
  console.log(`Invalid Test ${index + 1}: "${code}"`);
  console.log(`- Valid: ${parsed.isValid}`);
  console.log(`- Error: ${parsed.error}`);
  console.log("");
});

console.log("🎉 Testing completed!");

