import { db } from "../db";
import { addresses } from "../db/schema";
import { sql } from "drizzle-orm";

// --- Rural Address Types ---
export enum RuralAddressType {
  LANDMARK_BASED = "landmark",
  DIRECTION_BASED = "direction",
  VILLAGE_AREA = "village",
  TRADITIONAL_NAME = "traditional",
  COORDINATE_DESCRIPTION = "coordinate",
  CLOSEST_KNOWN_POINT = "closest_point",
}

// --- Rural Address Generation Strategies ---

/**
 * Generate a descriptive address using landmarks and directions
 */
export function generateLandmarkBasedAddress(options: {
  primaryLandmark: string;
  secondaryLandmark?: string;
  direction?: string;
  distance?: string;
  description?: string;
}): string {
  const {
    primaryLandmark,
    secondaryLandmark,
    direction,
    distance,
    description,
  } = options;

  let address = primaryLandmark;

  if (direction && distance) {
    address += `, ${distance} ${direction}`;
  }

  if (secondaryLandmark) {
    address += `, near ${secondaryLandmark}`;
  }

  if (description) {
    address += ` (${description})`;
  }

  return address;
}

/**
 * Generate a direction-based address from a known point
 */
export function generateDirectionBasedAddress(options: {
  referencePoint: string;
  direction: string;
  distance: string;
  additionalInfo?: string;
}): string {
  const { referencePoint, direction, distance, additionalInfo } = options;

  let address = `${distance} ${direction} of ${referencePoint}`;

  if (additionalInfo) {
    address += `, ${additionalInfo}`;
  }

  return address;
}

/**
 * Generate a village/area-based address
 */
export function generateVillageAreaAddress(options: {
  village: string;
  area?: string;
  quarter?: string;
  familyName?: string;
  localName?: string;
}): string {
  const { village, area, quarter, familyName, localName } = options;

  let address = village;

  if (area) {
    address += `, ${area} Area`;
  }

  if (quarter) {
    address += `, ${quarter} Quarter`;
  }

  if (familyName) {
    address += `, ${familyName} Compound`;
  }

  if (localName) {
    address += ` (${localName})`;
  }

  return address;
}

/**
 * Generate a coordinate-based human-readable address
 */
export function generateCoordinateDescription(
  latitude: number,
  longitude: number,
  nearestTown?: string
): string {
  // Convert coordinates to more readable format
  const latDir = latitude >= 0 ? "N" : "S";
  const lonDir = longitude >= 0 ? "E" : "W";
  const latDeg = Math.abs(Math.floor(latitude));
  const latMin = Math.abs((latitude - Math.floor(latitude)) * 60).toFixed(3);
  const lonDeg = Math.abs(Math.floor(longitude));
  const lonMin = Math.abs((longitude - Math.floor(longitude)) * 60).toFixed(3);

  let address = `${latDeg}°${latMin}'${latDir}, ${lonDeg}°${lonMin}'${lonDir}`;

  if (nearestTown) {
    address += ` (nearest town: ${nearestTown})`;
  }

  return address;
}

// --- Rural Address Suggestions ---

/**
 * Suggest address components based on common Nigerian rural patterns
 */
export function generateRuralAddressSuggestions(
  city: string,
  landmark?: string
): {
  landmarks: string[];
  directions: string[];
  villages: string[];
  traditional: string[];
} {
  //   const cityLower = city.toLowerCase();
  console.log("landmark", landmark);

  const landmarkSuggestions = [
    "Main Market",
    "Primary School",
    "Health Centre",
    "Police Station",
    "Motor Park",
    "Church",
    "Mosque",
    "Community Center",
    "Water Borehole",
    "Village Square",
    "Post Office",
    "Bank Branch",
    "Filling Station",
    "River/Stream",
    "Hill/Mountain",
    "Farm Settlement",
    "Traditional Ruler's Palace",
    "Local Government Office",
  ];

  const directionSuggestions = [
    "North",
    "South",
    "East",
    "West",
    "Northeast",
    "Northwest",
    "Southeast",
    "Southwest",
  ];

  const villageSuggestions = [
    `${city} Village`,
    `New ${city}`,
    `Old ${city}`,
    `${city} Ward`,
    `${city} Community`,
    `${city} Settlement`,
  ];

  const traditionalSuggestions = [
    "Sabon Gari", // New town
    "Tudun Wada", // Settlement area
    "Unguwar", // Neighborhood
    "Gidan", // House of/Compound
    "Kasuwar", // Market area
    "Galadima", // Traditional title area
    "Madaki", // Traditional title area
    "Sarki", // Chief's area
    "Magaji", // Traditional leader area
  ];

  return {
    landmarks: landmarkSuggestions,
    directions: directionSuggestions,
    villages: villageSuggestions,
    traditional: traditionalSuggestions,
  };
}

// --- Smart Address Parser ---

/**
 * Parse and structure rural address input
 */
export function parseRuralAddressInput(input: string): {
  type: RuralAddressType;
  components: Record<string, string>;
  confidence: number;
} {
  const inputLower = input.toLowerCase();

  // Landmark-based patterns
  if (
    inputLower.includes("near") ||
    inputLower.includes("close to") ||
    inputLower.includes("beside")
  ) {
    return {
      type: RuralAddressType.LANDMARK_BASED,
      components: { description: input },
      confidence: 0.8,
    };
  }

  // Direction-based patterns
  if (inputLower.match(/(north|south|east|west|km|miles?) (of|from)/)) {
    return {
      type: RuralAddressType.DIRECTION_BASED,
      components: { description: input },
      confidence: 0.85,
    };
  }

  // Village/area patterns
  if (
    inputLower.includes("village") ||
    inputLower.includes("community") ||
    inputLower.includes("settlement")
  ) {
    return {
      type: RuralAddressType.VILLAGE_AREA,
      components: { description: input },
      confidence: 0.9,
    };
  }

  // Traditional naming patterns
  if (inputLower.match(/(unguwar|gidan|sabon|tudun|kasuwar|magaji|sarki)/)) {
    return {
      type: RuralAddressType.TRADITIONAL_NAME,
      components: { description: input },
      confidence: 0.75,
    };
  }

  // Default to coordinate description for unclear inputs
  return {
    type: RuralAddressType.COORDINATE_DESCRIPTION,
    components: { description: input },
    confidence: 0.5,
  };
}

// --- Address Validation and Enhancement ---

/**
 * Enhance rural address with additional context
 */
export async function enhanceRuralAddress(
  originalAddress: string,
  latitude: number,
  longitude: number,
  city: string
): Promise<{
  enhanced: string;
  fallbacks: string[];
  type: RuralAddressType;
}> {
  const parsed = parseRuralAddressInput(originalAddress);
  //   const suggestions = generateRuralAddressSuggestions(city);

  let enhanced = originalAddress;
  const fallbacks: string[] = [];

  // Add coordinate-based fallback
  fallbacks.push(generateCoordinateDescription(latitude, longitude, city));

  // Add landmark-based fallbacks
  fallbacks.push(
    generateLandmarkBasedAddress({
      primaryLandmark: `${city} Area`,
      description: "Rural location",
    })
  );

  // Add village-based fallback
  fallbacks.push(
    generateVillageAreaAddress({
      village: city,
      area: "Rural",
      localName: "GPS coordinates available",
    })
  );

  // Add direction-based fallback (assuming city center as reference)
  fallbacks.push(
    generateDirectionBasedAddress({
      referencePoint: `${city} town center`,
      direction: "outskirts",
      distance: "rural area",
      additionalInfo: "exact coordinates recorded",
    })
  );

  return {
    enhanced,
    fallbacks: [...new Set(fallbacks)], // Remove duplicates
    type: parsed.type,
  };
}

// --- Find Nearest Known Addresses ---

/**
 * Find nearby addresses that might help with context
 */
export async function findNearbyAddresses(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<
  Array<{
    address: string;
    distance: number;
    hhgCode: string;
  }>
> {
  try {
    // Using Haversine formula to find nearby addresses
    const nearbyAddresses = await db
      .select({
        id: addresses.id,
        street: addresses.street,
        city: addresses.city,
        landmark: addresses.landmark,
        specialDescription: addresses.specialDescription,
        hhgCode: addresses.hhgCode,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
      })
      .from(addresses)
      .where(
        sql`
          (6371 * acos(cos(radians(${latitude})) * cos(radians(CAST(latitude AS FLOAT))) * 
          cos(radians(CAST(longitude AS FLOAT)) - radians(${longitude})) + 
          sin(radians(${latitude})) * sin(radians(CAST(latitude AS FLOAT))))) < ${radiusKm}
        `
      )
      .limit(5);

    return nearbyAddresses.map((addr) => {
      let addressStr = "";
      if (addr.street) addressStr += addr.street + ", ";
      if (addr.landmark) addressStr += addr.landmark + ", ";
      if (addr.specialDescription) addressStr += addr.specialDescription + ", ";
      addressStr += addr.city;

      // Calculate distance using Haversine formula
      const lat1 = parseFloat(addr.latitude?.toString() || "0");
      const lon1 = parseFloat(addr.longitude?.toString() || "0");
      const R = 6371; // Earth's radius in km
      const dLat = ((lat1 - latitude) * Math.PI) / 180;
      const dLon = ((lon1 - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((lat1 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return {
        address: addressStr,
        distance: Math.round(distance * 100) / 100,
        hhgCode: addr.hhgCode || "",
      };
    });
  } catch (error) {
    console.error("Error finding nearby addresses:", error);
    return [];
  }
}

// --- Generate Rural Address Components ---

/**
 * Generate comprehensive rural address components
 */
export async function generateRuralAddressComponents(
  latitude: number,
  longitude: number,
  city: string,
  userInput?: string
): Promise<{
  primaryAddress: string;
  alternativeAddresses: string[];
  suggestedComponents: {
    landmarks: string[];
    directions: string[];
    villages: string[];
    traditional: string[];
  };
  nearbyAddresses: Array<{
    address: string;
    distance: number;
    hhgCode: string;
  }>;
  coordinateDescription: string;
}> {
  const suggestions = generateRuralAddressSuggestions(city);
  const nearbyAddresses = await findNearbyAddresses(latitude, longitude);
  const coordinateDescription = generateCoordinateDescription(
    latitude,
    longitude,
    city
  );

  let primaryAddress = userInput || coordinateDescription;

  if (userInput) {
    const enhanced = await enhanceRuralAddress(
      userInput,
      latitude,
      longitude,
      city
    );
    primaryAddress = enhanced.enhanced;
  }

  const alternativeAddresses = [
    generateLandmarkBasedAddress({
      primaryLandmark: `${city} Area`,
      description: "Rural location with GPS coordinates",
    }),
    generateVillageAreaAddress({
      village: city,
      area: "Outskirts",
      localName: "Exact location via coordinates",
    }),
    generateDirectionBasedAddress({
      referencePoint: city,
      direction: "rural area",
      distance: "countryside",
      additionalInfo: "GPS location recorded",
    }),
    coordinateDescription,
  ];

  return {
    primaryAddress,
    alternativeAddresses: [...new Set(alternativeAddresses)],
    suggestedComponents: suggestions,
    nearbyAddresses,
    coordinateDescription,
  };
}
