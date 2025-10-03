import { db } from "../db";
import { users } from "../db/schema";
import { isNull, isNotNull, eq } from "drizzle-orm";
import { createPersonalCode } from "../utils/personalCodeGenerator";

/**
 * Comprehensive script to verify all users have personal codes
 * and backfill any missing ones
 */
async function verifyAllUsersHavePersonalCodes() {
  console.log("🔍 Verifying all users have personal codes...\n");

  // Get total user count
  const totalUsers = await db.select({ count: users.id }).from(users);

  console.log(`📊 Total users in database: ${totalUsers.length}`);

  // Get users without personal codes
  const usersWithoutCodes = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phoneNumber: users.phoneNumber,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNull(users.personalCode));

  // Get users with personal codes
  const usersWithCodes = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      personalCode: users.personalCode,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(isNotNull(users.personalCode));

  console.log(`✅ Users with personal codes: ${usersWithCodes.length}`);
  console.log(`❌ Users without personal codes: ${usersWithoutCodes.length}\n`);

  if (usersWithoutCodes.length > 0) {
    console.log("🔧 Backfilling missing personal codes...\n");

    let updated = 0;
    for (const user of usersWithoutCodes) {
      try {
        const personalCode = createPersonalCode(
          {
            id: user.id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
          },
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
          .set({ personalCode })
          .where(eq(users.id, user.id));

        console.log(
          `✅ Generated personal code for ${
            user.email || user.id
          }: ${personalCode}`
        );
        updated++;
      } catch (error) {
        console.error(
          `❌ Failed to generate personal code for ${user.email || user.id}:`,
          error
        );
      }
    }

    console.log(
      `\n📈 Backfill complete. Updated ${updated}/${usersWithoutCodes.length} users.`
    );
  }

  // Verify all users now have personal codes
  const finalCheck = await db
    .select({
      id: users.id,
      email: users.email,
      personalCode: users.personalCode,
    })
    .from(users)
    .where(isNull(users.personalCode));

  if (finalCheck.length === 0) {
    console.log("\n🎉 SUCCESS: All users now have personal codes!");
  } else {
    console.log(
      `\n⚠️  WARNING: ${finalCheck.length} users still missing personal codes`
    );
  }

  // Show sample of personal codes
  console.log("\n📋 Sample of personal codes:");
  const sampleUsers = await db
    .select({
      email: users.email,
      personalCode: users.personalCode,
    })
    .from(users)
    .where(isNotNull(users.personalCode))
    .limit(5);

  sampleUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email}: ${user.personalCode}`);
  });

  return {
    totalUsers: totalUsers.length,
    usersWithCodes: usersWithCodes.length,
    usersWithoutCodes: usersWithoutCodes.length,
    backfilled: usersWithoutCodes.length,
  };
}

if (require.main === module) {
  verifyAllUsersHavePersonalCodes()
    .then((result) => {
      console.log("\n📊 Final Summary:");
      console.log(`   Total users: ${result.totalUsers}`);
      console.log(`   Users with codes: ${result.usersWithCodes}`);
      console.log(`   Users without codes: ${result.usersWithoutCodes}`);
      console.log(`   Backfilled: ${result.backfilled}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export default verifyAllUsersHavePersonalCodes;
