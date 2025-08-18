/**
 * Utilities for generating descriptive location information
 * for addresses with missing street names or in unmapped areas.
 */

import { AreaType } from "./addressing";

/**
 * Types of location descriptions that can be generated
 * when street name information is unavailable
 */
export enum DescriptionType {
  COORDINATE_BASED = "coordinate",
  LANDMARK_BASED = "landmark",
  AREA_BASED = "area",
  ZONE_BASED = "zone",
  REFERENCE_CODE = "reference"
}

/**
 * Options for generating location descriptions
 */
export interface DescriptionOptions {
  // Location information
  latitude?: number;
  longitude?: number;
  cityName?: string;
  lgaName?: string;
  stateName?: string;
  areaType?: string;
  areaCode?: string;
  
  // Nearby information
  nearbyLandmarks?: string[];
  nearbyBusiness?: string;
  
  // Digital Door Code
  ddc?: string;
  
  // Formatting preferences
  language?: string;
  includeCoordinates?: boolean;
  preferredStyle?: DescriptionType;
}

/**
 * Generates a human-friendly street name or location description 
 * when a formal street name is unavailable.
 * 
 * Uses a hierarchical fallback system based on available information:
 * 1. Landmark-based if landmarks are available
 * 2. Area/Zone-based if area information is available
 * 3. City/LGA based if that information is available
 * 4. Coordinate-based as a last resort
 * 
 * @param options Description generation options
 * @returns A human-readable location description
 */
export function generateLocationDescription(options: DescriptionOptions): string {
  // Default description with fallback to coordinates
  let description = "Unnamed location";
  
  // Hierarchical fallback system based on available information
  
  // 1. Try landmark-based description (highest priority if available)
  if (options.nearbyLandmarks?.length || options.nearbyBusiness) {
    const landmark = options.nearbyLandmarks?.[0] || options.nearbyBusiness;
    description = `Near ${landmark}`;
    
    // Add administrative context if available
    if (options.cityName) {
      description += ` in ${options.cityName}`;
    } else if (options.lgaName) {
      description += ` in ${options.lgaName} LGA`;
    }
    
    return finalize(description, options);
  }
  
  // 2. Try area/zone-based description
  if (options.areaType && options.areaCode) {
    if (options.areaType === AreaType.STREET || options.areaType === "STR") {
      description = `Unnamed street`;
      
      // Add area context
      if (options.cityName) {
        description += ` in ${options.cityName}`;
        
        // Add area code if we have city context
        description += ` (Area ${options.areaCode})`;
      } else if (options.lgaName) {
        description += ` in ${options.lgaName} LGA`;
      }
    } 
    else if (options.areaType === AreaType.ZONE || options.areaType === "Z") {
      description = `Zone ${options.areaCode}`;
      
      // Add administrative context
      if (options.cityName) {
        description += ` in ${options.cityName}`;
      } else if (options.lgaName) {
        description += ` in ${options.lgaName} LGA`;
      }
    }
    else if (options.areaType === AreaType.LANDMARK || options.areaType === "LMK") {
      description = `Landmark area ${options.areaCode}`;
      
      // Add administrative context
      if (options.cityName) {
        description += ` in ${options.cityName}`;
      } else if (options.lgaName) {
        description += ` in ${options.lgaName} LGA`;
      }
    }
    
    return finalize(description, options);
  }
  
  // 3. Try administrative area-based description
  if (options.cityName || options.lgaName || options.stateName) {
    if (options.cityName) {
      description = `Unnamed location in ${options.cityName}`;
    } else if (options.lgaName) {
      description = `Unnamed location in ${options.lgaName} LGA`;
    } else if (options.stateName) {
      description = `Unnamed location in ${options.stateName} State`;
    }
    
    return finalize(description, options);
  }
  
  // 4. Fallback to coordinate-based description (last resort)
  if (options.latitude !== undefined && options.longitude !== undefined) {
    // Format coordinates to 5 decimal places (approx. 1.1 meter precision at equator)
    const lat = options.latitude.toFixed(5);
    const lng = options.longitude.toFixed(5);
    description = `Location at coordinates ${lat}, ${lng}`;
  }
  
  return finalize(description, options);
}

/**
 * Finalizes the description by adding optional elements
 * like DDC reference code or coordinates
 */
function finalize(description: string, options: DescriptionOptions): string {
  // Add DDC reference if available and not already included
  if (options.ddc && !description.includes(options.ddc)) {
    description += ` (Ref: ${options.ddc})`;
  }
  
  // Add coordinates if explicitly requested and not already included
  if (options.includeCoordinates && 
      options.latitude !== undefined && 
      options.longitude !== undefined &&
      !description.includes("coordinates")) {
    const lat = options.latitude.toFixed(5);
    const lng = options.longitude.toFixed(5);
    description += ` [${lat}, ${lng}]`;
  }
  
  return description;
}

/**
 * Extracts options for location description from address data
 * 
 * @param address Address object from database or client
 * @returns Description options based on available address data
 */
export function getDescriptionOptionsFromAddress(address: any): DescriptionOptions {
  return {
    latitude: address.latitude ? parseFloat(address.latitude) : undefined,
    longitude: address.longitude ? parseFloat(address.longitude) : undefined,
    cityName: address.city,
    stateName: address.stateName,
    lgaName: address.lgaName,
    areaType: address.areaType,
    areaCode: address.areaCode,
    ddc: address.hhgCode,
    includeCoordinates: false
  };
}

/**
 * Determines if a street name is valid or should be generated
 * 
 * @param streetName The potential street name to validate
 * @returns True if the street name needs to be generated
 */
export function needsGeneratedStreetName(streetName?: string): boolean {
  if (!streetName) return true;
  
  const trimmed = streetName.trim();
  if (trimmed.length === 0) return true;
  
  // Check for placeholder values that should be replaced
  const placeholders = [
    "unknown", "unnamed", "no name", "n/a", "na", 
    "not available", "none", "nil", "null"
  ];
  
  return placeholders.some(p => 
    trimmed.toLowerCase() === p || 
    trimmed.toLowerCase().includes(`${p} street`)
  );
}
