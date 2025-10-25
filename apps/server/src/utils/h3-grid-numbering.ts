import { cellToLatLng, latLngToCell, getResolution } from "h3-js";
import { db } from "../db";
import { addresses } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Interface for the result of grid house number generation
 */
export interface GridHouseNumberResult {
  generatedNumber: string;
  h3Index: string;
  resolution: number;
  isCollision: boolean;
  collisionCount: number;
}

/**
 * Interface for existing addresses in the same H3 cell
 */
interface H3CellAddress {
  id: number;
  generatedHouseNumber: string | null;
  latitude: string;
  longitude: string;
}

/**
 * Converts latitude and longitude to H3 cell index at resolution 12
 * Resolution 12 provides ~3-7 meters edge length, ~10-30 m² area per cell
 */
export function getH3Index(
  latitude: number,
  longitude: number,
  resolution: number = 12
): string {
  return latLngToCell(latitude, longitude, resolution);
}

/**
 * Extracts a meaningful house number from H3 index
 * Uses modulo to keep numbers in a reasonable range (1-999)
 * Example: 8a1fb46622dffff -> 17919 % 1000 = 919 -> 920
 */
export function extractBaseHouseNumber(h3Index: string): number {
  // Get the last 4 characters of the H3 index (hex)
  const lastFour = h3Index.slice(-4);

  // Convert from hex to decimal
  const decimal = parseInt(lastFour, 16);

  // Use modulo to keep numbers in reasonable range (1-999)
  const houseNumber = (decimal % 1000) + 1;

  // Round to nearest 10 for consistency
  const rounded = Math.round(houseNumber / 10) * 10;

  // Ensure it's at least 10 and at most 990
  return Math.max(10, Math.min(990, rounded));
}

/**
 * Queries the database for all addresses in the same H3 cell
 */
export async function getH3CellAddresses(
  h3Index: string
): Promise<H3CellAddress[]> {
  try {
    const result = await db
      .select({
        id: addresses.id,
        generatedHouseNumber: addresses.generatedHouseNumber,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
      })
      .from(addresses)
      .where(eq(addresses.h3Index, h3Index));

    return result;
  } catch (error) {
    console.error("Error querying H3 cell addresses:", error);
    return [];
  }
}

/**
 * Determines the next available house number in the sequence
 * Handles the 10s sequence with sequential numbers for collisions
 * Example: 8740, 8741, 8742, 8743... up to 8749
 */
export function getNextHouseNumber(
  baseNumber: number,
  existingAddresses: H3CellAddress[]
): { generatedNumber: string; isCollision: boolean; collisionCount: number } {
  // Filter out addresses without generated house numbers
  const addressesWithNumbers = existingAddresses.filter(
    (addr) => addr.generatedHouseNumber
  );

  // Extract existing numbers from the same base
  const existingNumbers = addressesWithNumbers
    .map((addr) => {
      const num = parseInt(addr.generatedHouseNumber || "0", 10);
      return num;
    })
    .filter((num) => num >= baseNumber && num < baseNumber + 10)
    .sort((a, b) => a - b);

  // If no existing numbers, use the base number
  if (existingNumbers.length === 0) {
    return {
      generatedNumber: baseNumber.toString(),
      isCollision: false,
      collisionCount: 0,
    };
  }

  // Find the next available number in sequence
  let nextNumber = baseNumber;
  for (const existingNum of existingNumbers) {
    if (nextNumber === existingNum) {
      nextNumber++;
    } else {
      break;
    }
  }

  // Check if we've exceeded the limit (base + 9 = 10 total addresses per cell)
  if (nextNumber >= baseNumber + 10) {
    throw new Error(
      `Grid cell is full: maximum 10 addresses per cell (${baseNumber}-${
        baseNumber + 9
      })`
    );
  }

  return {
    generatedNumber: nextNumber.toString(),
    isCollision: true,
    collisionCount: existingNumbers.length,
  };
}

/**
 * Main function to generate a grid-based house number
 * Implements the 10s sequence with sequential collision handling
 */
export async function generateGridHouseNumber(
  latitude: number,
  longitude: number,
  resolution: number = 12
): Promise<GridHouseNumberResult> {
  try {
    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Invalid coordinates provided");
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error("Coordinates out of valid range");
    }

    // Convert coordinates to H3 cell index
    const h3Index = getH3Index(latitude, longitude, resolution);

    // Verify the resolution
    const actualResolution = getResolution(h3Index);
    if (actualResolution !== resolution) {
      console.warn(
        `Expected resolution ${resolution}, got ${actualResolution}`
      );
    }

    // Extract base house number from H3 index
    const baseNumber = extractBaseHouseNumber(h3Index);

    // Query existing addresses in the same H3 cell
    const existingAddresses = await getH3CellAddresses(h3Index);

    // Determine the next available house number
    const { generatedNumber, isCollision, collisionCount } = getNextHouseNumber(
      baseNumber,
      existingAddresses
    );

    return {
      generatedNumber,
      h3Index,
      resolution: actualResolution,
      isCollision,
      collisionCount,
    };
  } catch (error) {
    console.error("Error generating grid house number:", error);
    throw error;
  }
}

/**
 * Validates that a house number is within the expected range for its base
 */
export function validateHouseNumber(
  generatedNumber: string,
  baseNumber: number
): boolean {
  const num = parseInt(generatedNumber, 10);
  return num >= baseNumber && num < baseNumber + 10;
}

/**
 * Gets the base number for a given house number
 * Example: 8742 -> 8740, 8741 -> 8740
 */
export function getBaseNumber(houseNumber: string): number {
  const num = parseInt(houseNumber, 10);
  return Math.floor(num / 10) * 10;
}

/**
 * Checks if two addresses are in the same H3 cell
 */
export function areInSameH3Cell(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  resolution: number = 12
): boolean {
  const h3Index1 = getH3Index(lat1, lon1, resolution);
  const h3Index2 = getH3Index(lat2, lon2, resolution);
  return h3Index1 === h3Index2;
}

/**
 * Gets the center coordinates of an H3 cell
 */
export function getH3CellCenter(h3Index: string): {
  latitude: number;
  longitude: number;
} {
  const [lat, lng] = cellToLatLng(h3Index);
  return { latitude: lat, longitude: lng };
}

/**
 * Gets the area of an H3 cell in square meters
 */
export function getH3CellArea(h3Index: string): number {
  // H3 provides area in square meters at resolution 12
  // This is approximate and varies by latitude
  const resolution = getResolution(h3Index);

  // Approximate area calculation for different resolutions
  const areaMap: { [key: number]: number } = {
    10: 150000, // ~150,000 m²
    11: 20000, // ~20,000 m²
    12: 3000, // ~3,000 m²
    13: 400, // ~400 m²
    14: 60, // ~60 m²
    15: 8, // ~8 m²
  };

  return areaMap[resolution] || 3000; // Default to resolution 12 area
}
