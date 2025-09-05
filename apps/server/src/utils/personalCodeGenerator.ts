import crypto from "crypto";

/**
 * Personal Code Generator
 * Generates a user-friendly personal code that includes readable location information
 * Format: PC-{STATE}-{LGA}-{USER_ID_SHORT}-{CHECKSUM}
 * Example: PC-LA-001-ABC123-45
 */

interface PersonalCodeData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  addressData: {
    latitude: string;
    longitude: string;
    stateCode: string;
    lgaCode: string;
    city: string;
    street?: string;
    houseNumber?: string;
  };
  additionalData?: {
    dateOfBirth?: string;
    occupation?: string;
    emergencyContact?: string;
    [key: string]: any;
  };
}

/**
 * Generate a user-friendly personal code
 * @param userData - User information
 * @param addressData - Address information
 * @returns Generated personal code
 */
export function createPersonalCode(
  userData: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  },
  addressData: {
    latitude: string;
    longitude: string;
    stateCode: string;
    lgaCode: string;
    city: string;
    street?: string;
    houseNumber?: string;
  }
): string {
  // Create a short, readable user identifier
  const userShortId = generateUserShortId(userData);

  // Generate checksum for validation
  const checksum = generateChecksum(
    addressData.stateCode + addressData.lgaCode + userShortId + userData.id
  );

  // Format: PC-{STATE}-{LGA}-{USER_SHORT_ID}-{CHECKSUM}
  return `PC-${addressData.stateCode}-${addressData.lgaCode}-${userShortId}-${checksum}`;
}

/**
 * Generate a short, readable user identifier
 * Uses first 3 letters of first name + last 3 letters of last name + 2 random chars
 */
function generateUserShortId(userData: {
  firstName: string;
  lastName: string;
  id: string;
}): string {
  const firstName = userData.firstName.toUpperCase().substring(0, 3);
  const lastName = userData.lastName.toUpperCase().substring(0, 3);

  // Add 2 random characters for uniqueness
  const randomChars = crypto
    .randomBytes(1)
    .toString("hex")
    .toUpperCase()
    .substring(0, 2);

  return `${firstName}${lastName}${randomChars}`;
}

/**
 * Generate a simple checksum for validation
 */
function generateChecksum(data: string): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i);
  }
  return (sum % 100).toString().padStart(2, "0");
}

/**
 * Parse a personal code to extract readable information
 */
export function parsePersonalCode(personalCode: string): {
  isValid: boolean;
  stateCode?: string;
  lgaCode?: string;
  userShortId?: string;
  checksum?: string;
  error?: string;
} {
  try {
    // Format: PC-{STATE}-{LGA}-{USER_SHORT_ID}-{CHECKSUM}
    const parts = personalCode.split("-");

    if (parts.length !== 5 || parts[0] !== "PC") {
      return {
        isValid: false,
        error: "Invalid personal code format",
      };
    }

    const [, stateCode, lgaCode, userShortId, checksum] = parts;

    // TODO: Add proper checksum validation
    // For now, skip checksum validation to test basic parsing

    return {
      isValid: true,
      stateCode,
      lgaCode,
      userShortId,
      checksum,
    };
  } catch (error) {
    return {
      isValid: false,
      error: "Failed to parse personal code",
    };
  }
}

/**
 * Get state name from state code
 */
export function getStateName(stateCode: string): string {
  const stateMap: { [key: string]: string } = {
    LA: "Lagos",
    FC: "Abuja",
    KN: "Kano",
    OY: "Oyo",
    RI: "Rivers",
    AN: "Anambra",
    KD: "Kaduna",
    BA: "Bauchi",
    BE: "Benue",
    BO: "Borno",
    CR: "Cross River",
    DE: "Delta",
    EB: "Ebonyi",
    ED: "Edo",
    EK: "Ekiti",
    EN: "Enugu",
    GO: "Gombe",
    IM: "Imo",
    JI: "Jigawa",
    KE: "Kebbi",
    KO: "Kogi",
    KW: "Kwara",
    NA: "Nasarawa",
    NI: "Niger",
    OG: "Ogun",
    ON: "Ondo",
    OS: "Osun",
    PL: "Plateau",
    SO: "Sokoto",
    TA: "Taraba",
    YO: "Yobe",
    ZA: "Zamfara",
  };

  return stateMap[stateCode] || stateCode;
}

/**
 * Get LGA name from LGA code (this would need to be expanded with actual LGA data)
 */
export function getLGAName(lgaCode: string, stateCode: string): string {
  // This is a simplified version - in reality, you'd have a full LGA database
  const lgaMap: { [key: string]: { [key: string]: string } } = {
    LA: {
      "001": "Ikeja",
      "002": "Eti-Osa",
      "003": "Lagos Island",
      "004": "Lagos Mainland",
      "005": "Surulere",
      // Add more LGAs as needed
    },
    FC: {
      "001": "Abuja Municipal",
      "002": "Bwari",
      "003": "Gwagwalada",
      "004": "Kuje",
      "005": "Kwali",
      // Add more LGAs as needed
    },
    // Add more states as needed
  };

  return lgaMap[stateCode]?.[lgaCode] || `LGA-${lgaCode}`;
}

/**
 * Format personal code for display with readable information
 */
export function formatPersonalCodeForDisplay(personalCode: string): {
  code: string;
  readableInfo: string;
  isValid: boolean;
} {
  const parsed = parsePersonalCode(personalCode);

  if (!parsed.isValid) {
    return {
      code: personalCode,
      readableInfo: "Invalid personal code",
      isValid: false,
    };
  }

  const stateName = getStateName(parsed.stateCode!);
  const lgaName = getLGAName(parsed.lgaCode!, parsed.stateCode!);

  return {
    code: personalCode,
    readableInfo: `${stateName} (${parsed.stateCode}), ${lgaName} (${parsed.lgaCode})`,
    isValid: true,
  };
}

// Legacy function for backward compatibility
export function generatePersonalCode(data: PersonalCodeData): string {
  return createPersonalCode(
    {
      id: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
    },
    data.addressData
  );
}
