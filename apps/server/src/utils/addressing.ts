import ngeohash from "ngeohash";

// --- State/LGA Lookup ---
// IMPORTANT: Replace this with your actual implementation for finding
// the State and LGA based on coordinates. This might involve DB queries,
// API calls, or local GIS data lookups.
async function findStateLga(
  latitude: number,
  longitude: number
): Promise<{ stateCode: string; lgaCode: string } | null> {
  console.warn(
    "Using placeholder findStateLga function. Implement actual lookup!"
  );
  // Example placeholder logic (replace!) - Determines LGA based on latitude band
  if (latitude > 6.4 && latitude < 6.7 && longitude > 3.0 && longitude < 4.0) {
    return { stateCode: "LA", lgaCode: "015" }; // Simulate Ikeja, Lagos
  } else if (
    latitude > 10.4 &&
    latitude < 10.7 &&
    longitude > 7.3 &&
    longitude < 7.6
  ) {
    return { stateCode: "KD", lgaCode: "008" }; // Simulate Kaduna North, Kaduna
  }
  // Add more conditions or your actual lookup logic here...
  return null; // Return null if no LGA is found
}

// --- HHG Code Generation ---

const GEOHASH_PRECISION = 7; // 7 characters gives ~150m x 150m precision

/**
 * Generates a unique Hybrid Hierarchical Grid (HHG) code for Nigerian locations.
 * Format: NG-[StateCode]-[LGACode]-[Geohash]
 * Example: NG-LA-015-9FG4P8M
 *
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @returns The generated HHG code string, or null if state/LGA cannot be determined.
 */
export async function generateHhgCode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (
    latitude === null ||
    longitude === null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    console.error("Invalid coordinates provided for HHG generation.");
    return null;
  }

  const locationInfo = await findStateLga(latitude, longitude);

  if (!locationInfo) {
    console.warn(
      `Could not determine State/LGA for coordinates: ${latitude}, ${longitude}`
    );
    return null;
  }

  const { stateCode, lgaCode } = locationInfo;

  // Ensure LGA code is 3 digits padded with zeros (if necessary)
  // Note: The findStateLga function should ideally return it in the correct format already
  const paddedLgaCode = lgaCode.padStart(3, "0");

  try {
    const geohash = ngeohash.encode(latitude, longitude, GEOHASH_PRECISION);
    // Ensure geohash is uppercase for consistency, though ngeohash usually returns lowercase
    return `NG-${stateCode.toUpperCase()}-${paddedLgaCode}-${geohash.toUpperCase()}`;
  } catch (error) {
    console.error(
      `Error generating Geohash for ${latitude}, ${longitude}:`,
      error
    );
    return null;
  }
}

/**
 * Represents the data needed to update an existing address record.
 */
export interface AddressUpdateData {
  hhgCode: string;
  stateCode: string;
  lgaCode: string;
}

/**
 * Generates the necessary data fields (HHG code, state, LGA) for updating an address.
 *
 * @param latitude The latitude of the address.
 * @param longitude The longitude of the address.
 * @returns An object containing the update data, or null if generation fails.
 */
export async function generateAddressUpdateData(
  latitude: number,
  longitude: number
): Promise<AddressUpdateData | null> {
  if (
    latitude === null ||
    longitude === null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    console.error(
      "Invalid coordinates provided for address update generation."
    );
    return null;
  }

  const locationInfo = await findStateLga(latitude, longitude);

  if (!locationInfo) {
    console.warn(
      `Could not determine State/LGA for update coords: ${latitude}, ${longitude}`
    );
    return null;
  }

  const { stateCode, lgaCode } = locationInfo;
  const paddedLgaCode = lgaCode.padStart(3, "0");

  try {
    const geohash = ngeohash.encode(latitude, longitude, GEOHASH_PRECISION);
    const hhgCode = `NG-${stateCode.toUpperCase()}-${paddedLgaCode}-${geohash.toUpperCase()}`;

    return {
      hhgCode,
      stateCode: stateCode.toUpperCase(),
      lgaCode: paddedLgaCode,
    };
  } catch (error) {
    console.error(
      `Error generating Geohash for update ${latitude}, ${longitude}:`,
      error
    );
    return null;
  }
}
