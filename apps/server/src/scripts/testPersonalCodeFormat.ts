import {
  createPersonalCode,
  parsePersonalCode,
  formatPersonalCodeForDisplay,
} from "../utils/personalCodeGenerator";

// Test the new personal code format
console.log("🧪 Testing New Personal Code Format\n");

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
// console.log("- State Code:", parsed.stateCode);
// console.log("- LGA Code:", parsed.lgaCode);
// console.log("- User Short ID:", parsed.userShortId);
// console.log("- Checksum:", parsed.checksum);

// Format for display
const display = formatPersonalCodeForDisplay(personalCode);
console.log("\nDisplay Format:");
console.log("- Code:", display.code);
console.log("- Readable Info:", display.readableInfo);
console.log("- Valid:", display.isValid);

// Test with different users
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
  const display = formatPersonalCodeForDisplay(code);

  console.log(`Test Case ${index + 1}:`);
  console.log(`- User: ${testCase.user.firstName} ${testCase.user.lastName}`);
  console.log(`- Code: ${code}`);
  console.log(`- Location: ${display.readableInfo}`);
  console.log("");
});
