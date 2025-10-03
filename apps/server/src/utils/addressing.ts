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
export async function findStateLga(
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

    // Return the full LGA code as stored in the database
    // LGA codes are stored as full codes like "LA007", "AB001", etc.
    const fullLgaCode = lgaResult[0].code;

    return {
      stateCode,
      lgaCode: fullLgaCode, // Return the full LGA code, not just the numeric part
    };
  } catch (error) {
    console.error("Error looking up state/LGA:", error);
    return null;
  }
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

// --- Street Prefix Utilities ---
/**
 * Normalizes a street name to a canonical base form:
 * - Unicode normalize, remove diacritics
 * - Lowercase, trim
 * - Remove punctuation
 * - Remove common type tokens (street, road, avenue, etc.)
 * - Collapse multiple spaces
 */
function normalizeStreetBaseName(raw: string): string {
  try {
    const TYPE_TOKENS = [
      "street",
      "st",
      "road",
      "rd",
      "avenue",
      "ave",
      "close",
      "cl",
      "crescent",
      "cr",
      "lane",
      "ln",
      "drive",
      "dr",
      "way",
      "boulevard",
      "blvd",
      "estate",
      "phase",
    ];

    let s = raw.normalize("NFD");
    s = s.replace(/[\u0300-\u036f]/g, "");
    s = s.toLowerCase().trim();
    s = s.replace(/[^a-z0-9\s]/g, " ");
    s = s.replace(/\s+/g, " ");

    const parts = s.split(" ").filter(Boolean);
    const filtered = parts.filter((p) => !TYPE_TOKENS.includes(p));
    const base = (filtered.length ? filtered : parts).join(" ");
    return base.trim();
  } catch (_e) {
    return raw.toLowerCase().trim();
  }
}

/**
 * Derives a 3-character code from a normalized street base name.
 * - Prefer alphabetic characters; pad with X if fewer than 3
 * - If reserved or empty, derive via checksum fill
 */
function deriveThreeLetterStreetCode(normalizedBase: string): string {
  const RESERVED = new Set([
    "STR",
    "ROA",
    "AVE",
    "CLO",
    "DRI",
    "WAY",
    "BLV",
    "CRE",
    "LAN",
    "EST",
    "VIL",
    "COM",
    "PLO",
    "BLO",
    "LMK",
  ]);

  const lettersOnly = normalizedBase.replace(/[^a-z]/g, "");
  let code = lettersOnly.slice(0, 3).toUpperCase();
  if (code.length < 3) {
    const alnum = normalizedBase.replace(/[^a-z0-9]/g, "");
    code = (code + alnum.slice(0, 3 - code.length)).toUpperCase();
  }
  if (code.length < 3) code = (code + "XXX").slice(0, 3);

  if (RESERVED.has(code) || /^(X{3}|\s*)$/.test(code)) {
    let sum = 0;
    for (let i = 0; i < normalizedBase.length; i++)
      sum += normalizedBase.charCodeAt(i);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const a = alphabet[(sum + 0) % 26];
    const b = alphabet[(sum + 7) % 26];
    const c = alphabet[(sum + 13) % 26];
    code = `${a}${b}${c}`;
  }

  return code;
}

// --- Area Identifier Determination ---
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

    console.log("🔍 determineAreaIdentifier called with:", {
      latitude,
      streetName,
      landmark,
    });

    // 1. Try to determine area from street name first
    if (streetName && streetName.trim()) {
      const normalizedStreet = streetName.toLowerCase().trim();
      console.log("📍 Processing street name:", {
        original: streetName,
        normalized: normalizedStreet,
      });

      // Check for exact matches first
      if (STREET_AREA_MAPPING[normalizedStreet]) {
        areaCode = STREET_AREA_MAPPING[normalizedStreet];
        areaType = AreaType.STREET;
        console.log("✅ Found exact match:", areaCode);
      } else {
        console.log("❌ No exact match found, trying derivation first...");
        // Try derivation first for more meaningful codes
        const base = normalizeStreetBaseName(streetName);
        const derived = deriveThreeLetterStreetCode(base);
        console.log("🔧 Deriving from street name:", {
          original: streetName,
          base,
          derived,
        });

        if (derived && derived.length === 3) {
          areaCode = derived;
          areaType = AreaType.STREET;
          console.log("✅ Using derived code:", areaCode);
        } else {
          console.log("❌ Derivation failed, checking partial matches...");
          // Fallback to partial matches if derivation fails
          // Skip generic terms like "street", "road", "avenue" to avoid false matches
          const genericTerms = [
            "street",
            "road",
            "avenue",
            "close",
            "drive",
            "way",
            "boulevard",
            "crescent",
            "lane",
            "estate",
            "village",
            "compound",
            "plot",
            "block",
          ];

          for (const [key, value] of Object.entries(STREET_AREA_MAPPING)) {
            // Skip generic terms to avoid false matches
            if (genericTerms.includes(key)) continue;

            if (
              normalizedStreet.includes(key) ||
              key.includes(normalizedStreet)
            ) {
              areaCode = value;
              areaType = AreaType.STREET;
              console.log("✅ Found partial match:", { key, value, areaCode });
              break;
            }
          }
          console.log("🔍 After partial matching, areaCode:", areaCode);
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
        areaCode = "01";
      } else if (latitude > 7.0) {
        areaType = AreaType.LANDMARK;
        areaCode = "LMK";
      } else {
        areaType = AreaType.STREET;
        areaCode = "STR";
      }
    }

    const result = {
      type: areaType,
      code: areaCode,
    };

    console.log("🎯 Final area identifier result:", result);
    return result;
  } catch (error) {
    console.error("Error determining area identifier:", error);
    return null;
  }
}

// --- Generate sequential location number ---
/**
 * Returns a deterministic 4-digit location number based on coordinates.
 * This approach uses the fractional parts of the coordinates to create a
 * predictable and spatially relevant identifier.
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

  // Extract numeric part from LGA code for DDC generation
  // LGA codes are stored as full codes like "LA007", "AB001", etc.
  // For DDC generation, we need just the numeric part (007, 001, etc.)
  let normalizedLgaCode: string;

  // Extract numeric part from the LGA code
  const numericPart = resolvedLgaCode.replace(/^[A-Z]+/, ""); // Remove all leading letters
  const lgaNumber = parseInt(numericPart, 10);

  if (isNaN(lgaNumber) || lgaNumber < 0) {
    console.error(
      `Invalid LGA code: ${resolvedLgaCode}. Could not extract numeric part.`
    );
    // Fallback to default LGA code
    normalizedLgaCode = "01";
  } else {
    normalizedLgaCode = lgaNumber.toString().padStart(2, "0");
  }

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
    // For STR and LMK, use the code as-is if it's 3 chars, otherwise pad to 3
    if (code.length === 3) {
      formattedAreaCode = code;
    } else {
      formattedAreaCode = code.padStart(3, "0");
    }
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
 * Represents the data needed to update an existing address record.
 */
export interface AddressUpdateData {
  hhgCode: string;
  stateCode: string;
  lgaCode: string;
  areaType: string;
  areaCode: string;
  houseNumber?: string;
  locationNumber: string;
}

/**
 * Parses a Digital Door Code (DDC) into its component parts.
 * Simplified format: NG-XX-YY-ZZZ-HHHH-NNNN
 *
 * @param ddc The Digital Door Code to parse
 * @returns Object containing the parsed components, or null if invalid
 */
export function parseDDC(ddc: string): AddressUpdateData | null {
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
      hhgCode: ddc,
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
  isRural: boolean = false,
  streetName?: string,
  landmark?: string,
  houseNumber?: string,
  stateCode?: string,
  lgaCode?: string
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
  // Generate DDC using forwarded components when available
  const hhgCode = await generateHhgCode(
    latitude,
    longitude,
    streetName,
    landmark,
    houseNumber,
    stateCode,
    lgaCode
  );

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
