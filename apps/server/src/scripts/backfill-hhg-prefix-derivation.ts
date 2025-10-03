#!/usr/bin/env tsx

/**
 * Backfill existing HHG codes to apply the new normalized 3-letter street derivation.
 *
 * For each address:
 * - Regenerate HHG via generateHhgCode using stored coordinates and address fields
 * - Parse and update hhg_code, area_type, area_code, location_number
 * - Leaves house number as-is; generator embeds it when provided
 */

import { db } from "../db";
import { addresses, lgas } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateHhgCode, parseDDC } from "../utils/addressing";
import { sql } from "drizzle-orm";

interface AddressRecord {
  id: number;
  hhgCode: string | null;
  latitude: string;
  longitude: string;
  street?: string | null;
  landmark?: string | null;
  houseNumber?: string | null;
  stateCode?: string | null;
  lgaCode?: string | null;
}

async function fetchAddresses(): Promise<AddressRecord[]> {
  const rows = await db
    .select({
      id: addresses.id,
      hhgCode: addresses.hhgCode,
      latitude: addresses.latitude,
      longitude: addresses.longitude,
      street: addresses.street,
      landmark: addresses.landmark,
      houseNumber: addresses.houseNumber,
      stateCode: addresses.stateCode,
      lgaCode: addresses.lgaCode,
    })
    .from(addresses);

  return rows.map((r) => ({
    id: Number(r.id),
    hhgCode: r.hhgCode ?? null,
    latitude: String(r.latitude ?? ""),
    longitude: String(r.longitude ?? ""),
    street: r.street ?? undefined,
    landmark: r.landmark ?? undefined,
    houseNumber: r.houseNumber ?? undefined,
    stateCode: r.stateCode ?? undefined,
    lgaCode: r.lgaCode ?? undefined,
  }));
}

function normalizeLgaCode(lga?: string | null): string | undefined {
  if (!lga) return undefined;
  const cleaned = lga.replace(/^[A-Z]{2}/, "");
  const num = parseInt(cleaned, 10);
  if (Number.isNaN(num)) return undefined;
  return num.toString().padStart(2, "0");
}

async function backfillOne(address: AddressRecord): Promise<boolean> {
  const lat = parseFloat(address.latitude);
  const lon = parseFloat(address.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    console.warn(`Skipping ${address.id}: invalid coordinates`);
    return false;
  }

  const newCode = await generateHhgCode(
    lat,
    lon,
    address.street || undefined,
    address.landmark || undefined,
    address.houseNumber || undefined,
    address.stateCode || undefined,
    normalizeLgaCode(address.lgaCode)
  );

  if (!newCode) {
    console.warn(`Could not generate HHG for address ${address.id}`);
    return false;
  }

  const parsed = parseDDC(newCode);
  if (!parsed) {
    console.warn(`Could not parse generated HHG for address ${address.id}`);
    return false;
  }

  // Compose lga_code to match FK format if state is present
  const lgaForDb = parsed.stateCode
    ? `${parsed.stateCode}${parsed.lgaCode}`
    : parsed.lgaCode;

  // Check if LGA exists to avoid FK violation
  let canSetLga = false;
  try {
    const existing = await db
      .select({ code: lgas.code })
      .from(lgas)
      .where(eq(lgas.code, lgaForDb))
      .limit(1);
    canSetLga = existing.length > 0;
  } catch (_e) {
    canSetLga = false;
  }

  if (canSetLga) {
    await db.execute(sql`
      UPDATE addresses
      SET
        hhg_code = ${newCode},
        area_type = ${parsed.areaType},
        area_code = ${parsed.areaCode},
        location_number = ${parsed.locationNumber},
        state_code = ${parsed.stateCode},
        lga_code = ${lgaForDb},
        updated_at = NOW()
      WHERE id = ${address.id}
    `);
  } else {
    await db.execute(sql`
      UPDATE addresses
      SET
        hhg_code = ${newCode},
        area_type = ${parsed.areaType},
        area_code = ${parsed.areaCode},
        location_number = ${parsed.locationNumber},
        updated_at = NOW()
      WHERE id = ${address.id}
    `);
  }

  return true;
}

async function main() {
  console.log("🔄 Backfilling HHG codes with normalized street derivation...");
  const all = await fetchAddresses();
  console.log(`Found ${all.length} addresses`);

  let ok = 0;
  for (const addr of all) {
    try {
      const success = await backfillOne(addr);
      if (success) ok++;
    } catch (e) {
      console.error(`❌ Error on ${addr.id}:`, e);
    }
  }

  console.log(`✅ Done. Updated ${ok}/${all.length} addresses.`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
