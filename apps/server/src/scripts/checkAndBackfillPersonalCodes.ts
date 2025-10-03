import { db } from "../db";
import { users } from "../db/schema";
import { isNull, eq } from "drizzle-orm";
import { createPersonalCode } from "../utils/personalCodeGenerator";

/**
 * Checks for users without personal codes and backfills them.
 * Safe to run multiple times (idempotent for missing-only updates).
 */
async function checkAndBackfillPersonalCodes() {
  console.log("🔎 Checking for users without personal codes...");

  const usersMissing = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phoneNumber: users.phoneNumber,
    })
    .from(users)
    .where(isNull(users.personalCode));

  if (usersMissing.length === 0) {
    console.log("✅ All users have personal codes.");
    return { updated: 0 };
  }

  console.log(`📊 Found ${usersMissing.length} users without personal codes.`);

  let updated = 0;
  for (const u of usersMissing) {
    try {
      const code = createPersonalCode(
        {
          id: u.id,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phoneNumber: u.phoneNumber || "",
        },
        // Minimal address data; generator currently seeds by user id
        {
          latitude: "0",
          longitude: "0",
          stateCode: "LA",
          lgaCode: "001",
          city: "",
        }
      );

      await db
        .update(users)
        .set({ personalCode: code })
        .where(eq(users.id, u.id));
      console.log(`✅ Set personalCode for ${u.email || u.id}: ${code}`);
      updated++;
    } catch (err) {
      console.error(
        `❌ Failed to set personalCode for ${u.email || u.id}`,
        err
      );
    }
  }

  console.log(
    `\n📈 Backfill complete. Updated ${updated}/${usersMissing.length} users.`
  );
  return { updated };
}

if (require.main === module) {
  checkAndBackfillPersonalCodes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export default checkAndBackfillPersonalCodes;
