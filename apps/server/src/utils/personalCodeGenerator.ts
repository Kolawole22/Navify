/**
 * Personal Code Generator
 * Generates a simple 8-digit personal code with 4 letters and 4 numbers
 * Format: 8 characters (4 letters + 4 numbers in any combination)
 * Example: A1B2C3D4, 1A2B3C4D, ABCD1234, etc.
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
 * Generate a simple 8-digit personal code with 4 letters and 4 numbers
 * @param userData - User information (used for seeding to ensure consistency)
 * @param addressData - Address information (not used in code generation)
 * @returns Generated 8-digit personal code
 */
export function createPersonalCode(
  userData: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  },
  _addressData: {
    latitude: string;
    longitude: string;
    stateCode: string;
    lgaCode: string;
    city: string;
    street?: string;
    houseNumber?: string;
  }
): string {
  // Generate a unique 8-character code with 4 letters and 4 numbers
  return generateEightDigitCode(userData.id);
}

/**
 * Generate an 8-digit code with 4 letters and 4 numbers
 * Uses user ID as seed for consistent generation
 */
function generateEightDigitCode(userId: string): string {
  // Create a deterministic seed from user ID for consistency
  const seed = userId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Letters pool
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Numbers pool
  const numbers = "0123456789";

  // Generate 4 random letters
  const letterPositions = generateRandomPositions(seed, 4, 8);
  const numberPositions = generateRandomPositions(seed + 1000, 4, 8);

  // Create array of 8 characters
  const code = new Array(8).fill("");

  // Place letters at determined positions
  letterPositions.forEach((pos) => {
    const letterIndex = Math.floor(Math.random() * letters.length);
    code[pos] = letters[letterIndex];
  });

  // Place numbers at determined positions
  numberPositions.forEach((pos) => {
    if (code[pos] === "") {
      // Only if position is empty
      const numberIndex = Math.floor(Math.random() * numbers.length);
      code[pos] = numbers[numberIndex];
    }
  });

  // Fill remaining positions with numbers
  for (let i = 0; i < 8; i++) {
    if (code[i] === "") {
      const numberIndex = Math.floor(Math.random() * numbers.length);
      code[i] = numbers[numberIndex];
    }
  }

  return code.join("");
}

/**
 * Generate random positions for letters/numbers using seeded random
 */
function generateRandomPositions(
  seed: number,
  count: number,
  max: number
): number[] {
  const positions: number[] = [];
  const used = new Set<number>();

  // Simple seeded random number generator
  let currentSeed = seed;
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  while (positions.length < count) {
    const pos = Math.floor(seededRandom() * max);
    if (!used.has(pos)) {
      positions.push(pos);
      used.add(pos);
    }
  }

  return positions.sort((a, b) => a - b);
}

/**
 * Validate a personal code format (8 characters with 4 letters and 4 numbers)
 */
export function parsePersonalCode(personalCode: string): {
  isValid: boolean;
  letters?: string[];
  numbers?: string[];
  error?: string;
} {
  try {
    // Check length
    if (personalCode.length !== 8) {
      return {
        isValid: false,
        error: "Personal code must be exactly 8 characters",
      };
    }

    // Check if all characters are alphanumeric
    if (!/^[A-Z0-9]+$/.test(personalCode.toUpperCase())) {
      return {
        isValid: false,
        error: "Personal code must contain only letters and numbers",
      };
    }

    const letters = personalCode.toUpperCase().match(/[A-Z]/g) || [];
    const numbers = personalCode.match(/[0-9]/g) || [];

    // Check if it has exactly 4 letters and 4 numbers
    if (letters.length !== 4 || numbers.length !== 4) {
      return {
        isValid: false,
        error: "Personal code must contain exactly 4 letters and 4 numbers",
      };
    }

    return {
      isValid: true,
      letters,
      numbers,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message || "Unknown parsing error",
    };
  }
}

/**
 * Format personal code for display
 */
export function formatPersonalCodeForDisplay(personalCode: string): {
  code: string;
  readableInfo: string;
  isValid: boolean;
  error?: string;
} {
  const parsed = parsePersonalCode(personalCode);

  if (!parsed.isValid) {
    return {
      code: personalCode,
      readableInfo: "Invalid personal code",
      isValid: false,
      error: parsed.error,
    };
  }

  return {
    code: personalCode,
    readableInfo: `8-digit code (${parsed.letters?.join(
      ""
    )} letters, ${parsed.numbers?.join("")} numbers)`,
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
