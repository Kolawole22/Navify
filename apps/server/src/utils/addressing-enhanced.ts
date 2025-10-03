import { db } from "../db";
import { states, lgas } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateRuralAddressComponents } from "./rural-addressing";

// --- Area Type Enum ---
/**
 * Types of area identifiers used in the Digital Door Code
 */
export enum AreaType {
  STREET = "STR",
  ZONE = "Z",
  LANDMARK = "LMK",
}

// --- Street Name to Area Code Mapping ---
/**
 * Maps common street names and areas to standardized 3-character codes
 * This provides meaningful area identifiers instead of sequential numbers
 */
const STREET_AREA_MAPPING: { [key: string]: string } = {
  // Lagos Areas
  "victoria island": "VIC",
  vi: "VIC",
  ikoyi: "IKO",
  lekki: "LEK",
  ajah: "AJA",
  surulere: "SUR",
  yaba: "YAB",
  ikeja: "IKE",
  oshodi: "OSH",
  mushin: "MUS",
  agege: "AGE",
  alaba: "ALA",
  apapa: "APA",
  badagry: "BAD",
  epe: "EPE",
  ibadan: "IBA",
  "oshodi-isolo": "OSH",
  somolu: "SOM",
  mainland: "MAI",
  island: "ISL",

  // Abuja Areas
  asokoro: "ASO",
  maitama: "MAI",
  wuse: "WUS",
  garki: "GAR",
  gwarinpa: "GWA",
  kubwa: "KUB",
  lugu: "LUG",
  jabi: "JAB",
  utako: "UTA",
  "central business district": "CBD",
  cbd: "CBD",

  // Kano Areas
  nassarawa: "NAS",
  fagge: "FAG",
  dala: "DAL",
  tarauni: "TAR",
  kumbotso: "KUM",
  ungogo: "UNG",
  gwale: "GWA",
  "kano municipal": "KAN",

  // Port Harcourt Areas
  "g.r.a": "GRA",
  gra: "GRA",
  diobu: "DIO",
  woji: "WOJ",
  rumuokoro: "RUM",
  rumuola: "RUM",
  rumuomasi: "RUM",
  "trans-amadi": "TRA",
  "old g.r.a": "GRA",

  // Generic patterns
  street: "STR",
  road: "ROA",
  avenue: "AVE",
  close: "CLO",
  drive: "DRI",
  way: "WAY",
  boulevard: "BLV",
  crescent: "CRE",
  lane: "LAN",
  estate: "EST",
  village: "VIL",
  compound: "COM",
  plot: "PLO",
  block: "BLO",
};

/**
 * Landmark-based area mapping for areas without street names
 */
const LANDMARK_AREA_MAPPING: { [key: string]: string } = {
  hospital: "HOS",
  school: "SCH",
  church: "CHU",
  mosque: "MOS",
  market: "MAR",
  bank: "BAN",
  hotel: "HOT",
  restaurant: "RES",
  shopping: "SHO",
  mall: "MAL",
  university: "UNI",
  college: "COL",
  airport: "AIR",
  station: "STA",
  terminal: "TER",
  park: "PAR",
  garden: "GAR",
  stadium: "STA",
  theater: "THE",
  cinema: "CIN",
  pharmacy: "PHA",
  clinic: "CLI",
  office: "OFF",
  building: "BUI",
  tower: "TOW",
  plaza: "PLA",
  center: "CEN",
  complex: "COM",
};

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

// --- Enhanced Area Identifier Determination ---
/**
 * Determines the area identifier based on street name, landmark, and coordinates.
 * Uses street name mapping and grid system for more meaningful codes.
 */
async function determineAreaIdentifier(
  latitude: number,
  streetName?: string,
  landmark?: string
): Promise<{ type: AreaType; code: string } | null> {
  try {
    let areaCode = "001"; // Default fallback
    let areaType = AreaType.STREET; // Default type

    // 1. Try to determine area from street name first
    if (streetName && streetName.trim()) {
      const normalizedStreet = streetName.toLowerCase().trim();

      // Check for exact matches first
      if (STREET_AREA_MAPPING[normalizedStreet]) {
        areaCode = STREET_AREA_MAPPING[normalizedStreet];
        areaType = AreaType.STREET;
      } else {
        // Check for partial matches
        for (const [key, value] of Object.entries(STREET_AREA_MAPPING)) {
          if (
            normalizedStreet.includes(key) ||
            key.includes(normalizedStreet)
          ) {
            areaCode = value;
            areaType = AreaType.STREET;
            break;
          }
        }
      }
    }

    // 2. If no street match, try landmark
    if (areaCode === "001" && landmark && landmark.trim()) {
      const normalizedLandmark = landmark.toLowerCase().trim();

      if (LANDMARK_AREA_MAPPING[normalizedLandmark]) {
        areaCode = LANDMARK_AREA_MAPPING[normalizedLandmark];
        areaType = AreaType.LANDMARK;
      } else {
        // Check for partial matches
        for (const [key, value] of Object.entries(LANDMARK_AREA_MAPPING)) {
          if (
            normalizedLandmark.includes(key) ||
            key.includes(normalizedLandmark)
          ) {
            areaCode = value;
            areaType = AreaType.LANDMARK;
            break;
          }
        }
      }
    }

    // 3. If still no match, use coordinate-based zone
    if (areaCode === "001") {
      // Use coordinate-based zone determination
      if (latitude > 9.0) {
        areaType = AreaType.ZONE;
        areaCode = "Z01";
      } else if (latitude > 7.0) {
        areaType = AreaType.LANDMARK;
        areaCode = "LMK";
      } else {
        areaType = AreaType.STREET;
        areaCode = "STR";
      }
    }

    return {
      type: areaType,
      code: areaCode,
    };
  } catch (error) {
    console.error("Error determining area identifier:", error);
    return null;
  }
}

// --- Enhanced Location Number Generation ---
/**
 * Generates a 4-digit location number based on coordinates
 */
function getNextLocationNumber(latitude: number, longitude: number): string {
  try {
    // Base location number from coordinates
    const latPart = Math.floor((latitude % 1) * 100);
    const lonPart = Math.floor((longitude % 1) * 100);
    const locationNumber = `${latPart.toString().padStart(2, "0")}${lonPart
      .toString()
      .padStart(2, "0")}`;

    return locationNumber;
  } catch (error) {
    console.error("Error generating location number:", error);
    // Fallback to random number
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return randomNum.toString();
  }
}

/**
 * Generates a unique Digital Door Code (DDC) for Nigerian locations.
 * Simplified format: NG-XX-YY-ZZZ-HHHH-NNNN
 *   XX: Two-letter state code (e.g., LA for Lagos, KD for Kaduna)
 *   YY: Two-digit LGA code within the state
 *   ZZZ: Three-character area identifier with type prefix (STR, Z, or LMK)
 *   HHHH: Street number (1-5 digits, no padding, 0 if not provided)
 *   NNNN: Four-digit unique location number (coordinates-based)
 *
 * Examples:
 *   NG-LA-15-VIC-42-1234 (Victoria Island, house 42, location 1234)
 *   NG-KD-08-Z01-0-0123 (Zone 01, no house number, location 123)
 *   NG-FC-01-HOS-7-5678 (Hospital area, house 7, location 5678)
 *
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @param streetName Optional street name for area identification.
 * @param landmark Optional landmark for area identification.
 * @param houseNumber Optional house number for location identification.
 * @param stateCode Optional state code to use instead of looking it up.
 * @param lgaCode Optional LGA code to use instead of looking it up.
 * @returns The generated DDC string, or null if determination fails.
 */
export async function generateHhgCode(
  latitude: number,
  longitude: number,
  streetName?: string,
  landmark?: string,
  houseNumber?: string,
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
  // Normalize LGA code to 2 digits (remove leading zeros)
  const normalizedLgaCode = parseInt(resolvedLgaCode, 10)
    .toString()
    .padStart(2, "0");

  // 2. Determine area identifier with enhanced logic
  const areaInfo = await determineAreaIdentifier(
    latitude,
    streetName,
    landmark
  );
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
    // For zone, use Z prefix with 2 digits (e.g., Z01)
    formattedAreaCode = `${type}${code.padStart(2, "0")}`;
  } else {
    // For STR and LMK, use full 3-char prefix and 3 chars (e.g., VIC, HOS)
    formattedAreaCode = code.padStart(3, "0");
  }

  // Generate location number (coordinates-based only)
  const locationNumber = getNextLocationNumber(latitude, longitude);

  // Format street number (1-5 digits, no padding, 0 if not provided)
  let formattedStreetNumber =
    houseNumber && houseNumber.trim()
      ? parseInt(houseNumber.replace(/\D/g, ""), 10).toString()
      : "0";

  // Validate street number length (1-5 digits)
  if (formattedStreetNumber !== "0" && formattedStreetNumber.length > 5) {
    console.warn(
      `Street number ${formattedStreetNumber} is too long, truncating to 5 digits`
    );
    formattedStreetNumber = formattedStreetNumber.slice(0, 5);
  }

  // Assemble the simplified DDC
  const ddc = `NG-${resolvedStateCode.toUpperCase()}-${normalizedLgaCode}-${formattedAreaCode}-${formattedStreetNumber}-${locationNumber}`;

  return ddc;
}

/**
 * Parses a Digital Door Code (DDC) into its component parts.
 * Simplified format: NG-XX-YY-ZZZ-HHHH-NNNN
 *
 * @param ddc The Digital Door Code to parse
 * @returns Object containing the parsed components, or null if invalid
 */
export function parseDDC(ddc: string): {
  stateCode: string;
  lgaCode: string;
  areaType: string;
  areaCode: string;
  houseNumber?: string;
  locationNumber: string;
} | null {
  try {
    // Simplified regex for new format: NG-XX-YY-ZZZ-HHHH-NNNN
    const ddcRegex = /^NG-([A-Z]{2})-(\d{2})-([A-Z0-9]{3})-(\d{1,5})-(\d{4})$/;
    const match = ddc.match(ddcRegex);

    if (!match) {
      console.error(`Invalid DDC format: ${ddc}`);
      return null;
    }

    const [, stateCode, lgaCode, areaCode, houseNumber, locationNumber] = match;

    // Determine area type from area code
    let areaType: string;
    if (areaCode.startsWith("Z")) {
      areaType = "ZONE";
    } else if (
      areaCode.startsWith("LMK") ||
      areaCode.startsWith("HOS") ||
      areaCode.startsWith("SCH")
    ) {
      areaType = "LANDMARK";
    } else {
      areaType = "STREET";
    }

    return {
      stateCode,
      lgaCode,
      areaType,
      areaCode,
      houseNumber: houseNumber === "0" ? undefined : houseNumber,
      locationNumber,
    };
  } catch (error) {
    console.error("Error parsing DDC:", error);
    return null;
  }
}

/**
 * Represents the data needed to update an existing address record.
 */
export interface AddressUpdateData {
  hhgCode: string;
  street?: string;
  city?: string;
  houseNumber?: string;
  landmark?: string;
  floor?: string;
  estate?: string;
  specialDescription?: string;
  latitude?: number;
  longitude?: number;
  stateCode?: string;
  lgaCode?: string;
  areaType?: string;
  areaCode?: string;
  locationNumber?: string;
  isSaved?: boolean;
  label?: string;
  category?: string;
  photoUrls?: string[];
}

/**
 * Checks if a street name needs to be generated (for rural areas)
 */
export function needsGeneratedStreetName(streetName?: string): boolean {
  return !streetName || streetName.trim() === "" || streetName === "N/A";
}

/**
 * Generates a street name for rural areas based on coordinates
 */
export async function generateStreetName(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const ruralComponents = await generateRuralAddressComponents(
      latitude,
      longitude,
      "Unknown City"
    );
    return ruralComponents.primaryAddress || "Rural Area";
  } catch (error) {
    console.error("Error generating street name:", error);
    return "Rural Area";
  }
}
