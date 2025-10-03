#!/usr/bin/env tsx

/**
 * Creates three users with addresses for local testing.
 * - Two users include street names
 * - One user omits street (rural/landmark-only), exercising enhanced generation
 */

import { db } from "../db";
import { users, addresses } from "../db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { generateEnhancedAddress, parseDDC } from "../utils/addressing";

interface NewUserInput {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  password: string;
  // Address
  latitude: number;
  longitude: number;
  city: string;
  street?: string;
  houseNumber?: string;
  landmark?: string;
  stateCode?: string;
  lgaCode?: string;
  noStreetAddress?: boolean;
  label?: string;
}

const samples: NewUserInput[] = [
  {
    email: "ada.okafor@example.com",
    phoneNumber: "+2348011111111",
    firstName: "Ada",
    lastName: "Okafor",
    password: "Password123!",
    latitude: 6.4384, // Lagos
    longitude: 3.4236,
    city: "Lagos",
    street: "Adeola Odeku Street",
    houseNumber: "12",
    landmark: "Near Eko Hotel",
    stateCode: "LA",
    lgaCode: "08",
    label: "Home",
  },
  {
    email: "tunde.balogun@example.com",
    phoneNumber: "+2348022222222",
    firstName: "Tunde",
    lastName: "Balogun",
    password: "Password123!",
    latitude: 9.0723, // Abuja
    longitude: 7.491,
    city: "Abuja",
    // No street provided; simulate rural/landmark-only
    noStreetAddress: true,
    landmark: "Community Health Center",
    stateCode: "FC",
    lgaCode: "01",
    label: "Village",
  },
  {
    email: "amina.saidu@example.com",
    phoneNumber: "+2348033333333",
    firstName: "Amina",
    lastName: "Saidu",
    password: "Password123!",
    latitude: 12.0006, // Kano area
    longitude: 8.5167,
    city: "Kano",
    street: "Airport Road",
    houseNumber: "7A",
    landmark: "Near Roundabout",
    stateCode: "KN",
    lgaCode: "03",
    label: "Office",
  },
];

async function upsertUser(sample: NewUserInput) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, sample.email));
  if (existing.length) {
    return existing[0].id as string;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(sample.password, salt);

  const created = await db
    .insert(users)
    .values({
      email: sample.email,
      phoneNumber: sample.phoneNumber,
      firstName: sample.firstName,
      lastName: sample.lastName,
      passwordHash,
    })
    .returning({ id: users.id });

  if (!created.length) throw new Error("Failed to create user");
  return created[0].id as string;
}

async function createAddressForUser(userId: string, sample: NewUserInput) {
  const description = sample.landmark;

  const enhanced = await generateEnhancedAddress(
    sample.latitude,
    sample.longitude,
    sample.city,
    description,
    !!sample.noStreetAddress,
    sample.street,
    sample.landmark,
    sample.houseNumber,
    sample.stateCode,
    sample.lgaCode
  );

  const hhg = enhanced.hhgCode;
  if (!hhg) throw new Error("Failed to generate HHG code");

  const parsed = parseDDC(hhg);
  if (!parsed) throw new Error(`Failed to parse HHG: ${hhg}`);

  const streetValue = sample.noStreetAddress
    ? enhanced.addressComponents.primary
    : sample.street || "";
  const houseValue = sample.noStreetAddress ? "" : sample.houseNumber || "";

  const resolvedState = sample.stateCode || parsed.stateCode;
  const resolvedLgaTwoDigit = sample.lgaCode || parsed.lgaCode;
  const lgaForDb = resolvedState
    ? `${resolvedState}${resolvedLgaTwoDigit}`
    : resolvedLgaTwoDigit; // Fallback if state missing

  const inserted = await db
    .insert(addresses)
    .values({
      userId,
      street: streetValue,
      city: sample.city,
      houseNumber: houseValue,
      landmark: sample.landmark,
      latitude: sample.latitude,
      longitude: sample.longitude,
      estate: undefined as unknown as string | undefined,
      floor: undefined as unknown as string | undefined,
      specialDescription: undefined as unknown as string | undefined,
      photoUrls: undefined as unknown as string[] | undefined,
      hhgCode: hhg,
      stateCode: resolvedState,
      lgaCode: lgaForDb,
      areaType: parsed.areaType,
      areaCode: parsed.areaCode,
      locationNumber: parsed.locationNumber,
      isSaved: true,
      label: sample.label || "Home",
      category: undefined as unknown as string | undefined,
    } as any)
    .returning({ id: addresses.id });

  if (!inserted.length) throw new Error("Failed to create address");
  return inserted[0].id as number;
}

async function main() {
  console.log("👤 Creating sample users and addresses...");
  for (const sample of samples) {
    try {
      const userId = await upsertUser(sample);
      const addressId = await createAddressForUser(userId, sample);
      console.log(`✅ Created ${sample.email} → address ${addressId}`);
    } catch (e) {
      console.error(`❌ Failed for ${sample.email}:`, e);
    }
  }
  console.log("Done.");
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
