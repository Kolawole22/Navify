import { db } from "../db";
import { users, addresses } from "../db/schema";
import { eq, isNull } from "drizzle-orm";
import { createPersonalCode } from "../utils/personalCodeGenerator";

/**
 * Migration script to generate personal codes for existing users
 * Run this script to backfill personal codes for users who don't have them
 */

// Removed unused interface

async function generatePersonalCodesForExistingUsers() {
  console.log("🚀 Starting personal code generation for existing users...");

  try {
    // Get all users without personal codes
    const usersWithoutPersonalCode = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        personalCode: users.personalCode,
      })
      .from(users)
      .where(isNull(users.personalCode));

    console.log(
      `📊 Found ${usersWithoutPersonalCode.length} users without personal codes`
    );

    if (usersWithoutPersonalCode.length === 0) {
      console.log("✅ All users already have personal codes!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutPersonalCode) {
      try {
        // Get user's primary address (first saved address)
        const userAddresses = await db
          .select({
            latitude: addresses.latitude,
            longitude: addresses.longitude,
            stateCode: addresses.stateCode,
            lgaCode: addresses.lgaCode,
            city: addresses.city,
            street: addresses.street,
            houseNumber: addresses.houseNumber,
          })
          .from(addresses)
          .where(eq(addresses.userId, user.id))
          .limit(1);

        const address = userAddresses[0];

        if (!address) {
          console.log(`⚠️  User ${user.email} has no addresses, skipping...`);
          errorCount++;
          continue;
        }

        // Generate personal code
        const personalCode = createPersonalCode(
          {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
          },
          {
            latitude: address.latitude.toString(),
            longitude: address.longitude.toString(),
            stateCode: address.stateCode || "LA", // Default to Lagos if null
            lgaCode: address.lgaCode || "001", // Default LGA code if null
            city: address.city || "Unknown", // Default city if null
            street: address.street || "",
            houseNumber: address.houseNumber || "",
          }
        );

        // Update user with personal code
        await db
          .update(users)
          .set({ personalCode })
          .where(eq(users.id, user.id));

        console.log(
          `✅ Generated personal code for ${user.email}: ${personalCode}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error generating personal code for ${user.email}:`,
          error
        );
        errorCount++;
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`✅ Successfully generated: ${successCount} personal codes`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${successCount + errorCount}`);
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  generatePersonalCodesForExistingUsers()
    .then(() => {
      console.log("🎉 Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { generatePersonalCodesForExistingUsers };
