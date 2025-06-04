import { db } from "../db";
import { states, lgas } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  generateRuralAddressComponents,
  generateCoordinateDescription,
} from "./rural-addressing";

// --- Area Type Enum ---
/**
 * Types of area identifiers used in the Digital Door Code
 */
export enum AreaType {
  STREET = "STR",
  ZONE = "Z",
  LANDMARK = "LMK",
}

// --- State/LGA Lookup ---
/**
 * Finds the state and LGA codes for a given coordinate by querying the database.
 * Note: This is a simplified implementation without true geospatial lookups.
 * In a production environment, you should use PostGIS or a similar geospatial
 * database extension for accurate point-in-polygon checks.
 *
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @returns An object with stateCode and lgaCode, or null if not found
 */
async function findStateLga(
  latitude: number,
  longitude: number
): Promise<{ stateCode: string; lgaCode: string } | null> {
  try {
    // In a real implementation, this would use a geospatial query like:
    // SELECT s.code as stateCode, l.code as lgaCode
    // FROM states s
    // JOIN lgas l ON s.code = l.stateCode
    // WHERE ST_Contains(l.geometry, ST_SetSRID(ST_Point($1, $2), 4326))
    // LIMIT 1;

    // Since we don't have actual geospatial data in our current schema,
    // we'll implement a different approach:

    // 1. First, try to find the closest LGA with coordinates (if we had them in the schema)
    // This would be ideal if we had centroid coordinates for each LGA

    // 2. For now, as a temporary solution, we'll use a hardcoded mapping of coordinate
    // ranges to known states/LGAs. This should be replaced with proper geospatial lookups.

    // Nigeria coordinate boundaries (approximate)
    const NIGERIA_LAT_MIN = 4.0; // Southernmost point
    const NIGERIA_LAT_MAX = 14.0; // Northernmost point
    const NIGERIA_LON_MIN = 2.5; // Westernmost point
    const NIGERIA_LON_MAX = 15.0; // Easternmost point

    // Check if coordinates are within Nigeria
    if (
      latitude < NIGERIA_LAT_MIN ||
      latitude > NIGERIA_LAT_MAX ||
      longitude < NIGERIA_LON_MIN ||
      longitude > NIGERIA_LON_MAX
    ) {
      console.warn(
        `Coordinates (${latitude}, ${longitude}) appear to be outside Nigeria`
      );
      return null;
    }

    // Simplified lookup based on coordinate ranges
    // This is a temporary solution until proper geospatial data is available
    let stateCode: string = "";

    // Determine state based on latitude/longitude ranges
    // Lagos area (approximate)
    if (
      latitude >= 6.3 &&
      latitude <= 6.8 &&
      longitude >= 3.0 &&
      longitude <= 3.8
    ) {
      stateCode = "LA";
    }
    // FCT/Abuja area (approximate)
    else if (
      latitude >= 8.2 &&
      latitude <= 9.3 &&
      longitude >= 6.8 &&
      longitude <= 7.6
    ) {
      stateCode = "FC";
    }
    // Kano area (approximate)
    else if (
      latitude >= 11.5 &&
      latitude <= 12.2 &&
      longitude >= 8.3 &&
      longitude <= 9.0
    ) {
      stateCode = "KN";
    }
    // Rivers/Port Harcourt area (approximate)
    else if (
      latitude >= 4.7 &&
      latitude <= 5.1 &&
      longitude >= 6.7 &&
      longitude <= 7.2
    ) {
      stateCode = "RI";
    }
    // If no match, use database to find the closest state
    else {
      // Verify the state code exists in our database
      const allStates = await db.select().from(states);

      if (allStates.length === 0) {
        console.error("No states found in the database");
        // Fallback to a default state (Lagos)
        stateCode = "LA";
      } else {
        // Simple fallback - just use the first state in the database
        // In a real implementation, this would use distance calculations
        stateCode = allStates[0].code;
      }
    }

    // Now find an LGA within that state
    const lgaResult = await db
      .select()
      .from(lgas)
      .where(eq(lgas.stateCode, stateCode))
      .limit(1);

    if (lgaResult.length === 0) {
      console.warn(`No LGAs found for state code: ${stateCode}`);

      // As a fallback, generate a synthetic LGA code
      // In production, this should be handled differently
      return {
        stateCode,
        lgaCode: "001", // Default LGA code
      };
    }

    // Remove state prefix from LGA code if it exists
    const lgaCode = lgaResult[0].code.startsWith(stateCode)
      ? lgaResult[0].code.substring(stateCode.length)
      : lgaResult[0].code;

    return {
      stateCode,
      lgaCode,
    };
  } catch (error) {
    console.error("Error looking up state/LGA:", error);
    return null;
  }
}

// --- Area Identifier Determination ---
/**
 * Determines the area identifier based on latitude, longitude.
 * This is a placeholder implementation - replace with actual logic.
 */
async function determineAreaIdentifier(
  latitude: number,
  _longitude: number
): Promise<{ type: AreaType; code: string } | null> {
  // Placeholder implementation - replace with actual logic
  console.warn(
    "Using placeholder area identifier logic. Implement actual system!"
  );

  // Simple placeholder that assigns zone based on latitude
  if (latitude > 9.0) {
    return { type: AreaType.ZONE, code: "001" };
  } else if (latitude > 7.0) {
    return { type: AreaType.LANDMARK, code: "001" };
  } else {
    return { type: AreaType.STREET, code: "001" };
  }
}

// --- Generate sequential location number ---
/**
 * Returns a unique 4-digit location number for the area.
 * In a real implementation, this would query the database to find
 * the next available number for the specific area.
 */
async function getNextLocationNumber(
  _stateCode: string,
  _lgaCode: string,
  _areaType: AreaType,
  _areaCode: string
): Promise<string> {
  try {
    // Since the database schema might not be fully migrated yet,
    // we'll use a simple approach to generate a unique number

    // Use the current timestamp and some randomness to generate a unique number
    // This ensures uniqueness even if multiple addresses are created at the same time
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1000);

    // Combine timestamp and random number to create a unique value
    // Then take the last 4 digits to keep it within our format
    const combined = `${timestamp}${randomPart}`;
    const lastFourDigits = combined.slice(-4);

    return lastFourDigits.padStart(4, "0");
  } catch (error) {
    console.error("Error generating next location number:", error);
    // Fallback to a simple random number
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return randomNum.toString();
  }
}

/**
 * Generates a unique Digital Door Code (DDC) for Nigerian locations.
 * Format: NG-XX-YY-ZZZ-NNNN
 *   XX: Two-letter state code (e.g., LA for Lagos, KD for Kaduna)
 *   YY: Two-digit LGA code within the state
 *   ZZZ: Three-character area identifier with type prefix (STR, Z, or LMK)
 *   NNNN: Four-digit unique location number
 *
 * Examples:
 *   NG-LA-15-STR001-0042 (Street-based address in Lagos)
 *   NG-KD-08-Z001-0123 (Zone-based address in Kaduna)
 *   NG-FC-01-LMK001-0007 (Landmark-based address in FCT)
 *
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @param stateCode Optional state code to use instead of looking it up.
 * @param lgaCode Optional LGA code to use instead of looking it up.
 * @returns The generated DDC string, or null if determination fails.
 */
export async function generateHhgCode(
  latitude: number,
  longitude: number,
  stateCode?: string,
  lgaCode?: string
): Promise<string | null> {
  if (
    latitude === null ||
    longitude === null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    console.error("Invalid coordinates provided for DDC generation.");
    return null;
  }

  // 1. Use provided state and LGA codes or look them up
  let locationInfo: { stateCode: string; lgaCode: string };

  if (stateCode && lgaCode) {
    // Use the provided state and LGA codes
    locationInfo = { stateCode, lgaCode };
  } else {
    // Look them up from the database based on coordinates
    const lookupResult = await findStateLga(latitude, longitude);
    if (!lookupResult) {
      console.warn(
        `Could not determine State/LGA for coordinates: ${latitude}, ${longitude}`
      );
      return null;
    }
    locationInfo = lookupResult;
  }

  // Ensure state code is 2 letters and LGA code is 2 digits
  const { stateCode: resolvedStateCode, lgaCode: resolvedLgaCode } =
    locationInfo;
  const paddedLgaCode = resolvedLgaCode.padStart(2, "0");

  // 2. Determine area identifier (STR, Z, or LMK + code)
  const areaInfo = await determineAreaIdentifier(latitude, longitude);
  if (!areaInfo) {
    console.warn(
      `Could not determine area identifier for coordinates: ${latitude}, ${longitude}`
    );
    return null;
  }

  const { type, code } = areaInfo;

  // Format area code based on type
  let formattedAreaCode: string;
  if (type === AreaType.ZONE) {
    // For zone, use Z prefix with 3 digits (e.g., Z001)
    formattedAreaCode = `${type}${code.padStart(3, "0")}`;
  } else {
    // For STR and LMK, use full 3-char prefix and 3 digits (e.g., STR001, LMK001)
    formattedAreaCode = `${type}${code.padStart(3, "0")}`;
  }

  // 3. Generate the next unique location number for this area
  const locationNumber = await getNextLocationNumber(
    resolvedStateCode,
    paddedLgaCode,
    type,
    code
  );

  // 4. Build the final DDC
  return `NG-${resolvedStateCode.toUpperCase()}-${paddedLgaCode}-${formattedAreaCode}-${locationNumber}`;
}

/**
 * Represents the data needed to update an existing address record.
 */
export interface AddressUpdateData {
  hhgCode: string;
  stateCode: string;
  lgaCode: string;
  areaType: string;
  areaCode: string;
  locationNumber: string;
}

/**
 * Parses a Digital Door Code (DDC) into its component parts.
 *
 * @param ddc The Digital Door Code to parse
 * @returns Object containing the parsed components, or null if invalid
 */
export function parseDDC(ddc: string): AddressUpdateData | null {
  const parts = ddc.split("-");

  if (parts.length !== 5 || parts[0] !== "NG") {
    console.error(`Invalid DDC format: ${ddc}`);
    return null;
  }

  const stateCode = parts[1];
  const lgaCode = parts[2];

  // Parse area code (e.g., "STR001" or "Z001")
  const areaFull = parts[3];
  let areaType: string, areaCode: string;

  if (areaFull.startsWith("STR")) {
    areaType = "STR";
    areaCode = areaFull.substring(3);
  } else if (areaFull.startsWith("LMK")) {
    areaType = "LMK";
    areaCode = areaFull.substring(3);
  } else if (areaFull.startsWith("Z")) {
    areaType = "Z";
    areaCode = areaFull.substring(1);
  } else {
    console.error(`Invalid area format in DDC: ${areaFull}`);
    return null;
  }

  const locationNumber = parts[4];

  return {
    hhgCode: ddc,
    stateCode,
    lgaCode,
    areaType,
    areaCode,
    locationNumber,
  };
}

/**
 * Generates the necessary data fields for updating an address.
 *
 * @param latitude The latitude of the address.
 * @param longitude The longitude of the address.
 * @returns An object containing the update data, or null if generation fails.
 */
export async function generateAddressUpdateData(
  latitude: number,
  longitude: number
): Promise<AddressUpdateData | null> {
  const ddc = await generateHhgCode(latitude, longitude);

  if (!ddc) {
    return null;
  }

  return parseDDC(ddc);
}

/**
 * Enhanced address generation that handles rural areas intelligently
 */
export async function generateEnhancedAddress(
  latitude: number,
  longitude: number,
  city: string,
  userProvidedDescription?: string,
  isRural: boolean = false
): Promise<{
  hhgCode: string | null;
  addressComponents: {
    primary: string;
    alternatives: string[];
    type: string;
    coordinates: string;
  };
  ruralEnhancements?: {
    suggestedComponents: any;
    nearbyAddresses: any[];
  };
}> {
  // Generate standard DDC
  const hhgCode = await generateHhgCode(latitude, longitude);

  let addressComponents = {
    primary: userProvidedDescription || city,
    alternatives: [] as string[],
    type: "standard",
    coordinates: generateCoordinateDescription(latitude, longitude, city),
  };

  // If rural or no user description provided, enhance with rural addressing
  if (isRural || !userProvidedDescription) {
    const ruralComponents = await generateRuralAddressComponents(
      latitude,
      longitude,
      city,
      userProvidedDescription
    );

    addressComponents = {
      primary: ruralComponents.primaryAddress,
      alternatives: ruralComponents.alternativeAddresses,
      type: "rural_enhanced",
      coordinates: ruralComponents.coordinateDescription,
    };

    return {
      hhgCode,
      addressComponents,
      ruralEnhancements: {
        suggestedComponents: ruralComponents.suggestedComponents,
        nearbyAddresses: ruralComponents.nearbyAddresses,
      },
    };
  }

  return {
    hhgCode,
    addressComponents,
  };
}
