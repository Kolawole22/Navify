import { db } from "../db";
import { users, addresses } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { createPersonalCode } from "../utils/personalCodeGenerator";

/**
 * Script to update all existing personal codes to the new 8-digit format
 * This will replace any existing format with the new 8-digit format (4 letters + 4 numbers)
 */

async function updatePersonalCodesToEightDigitFormat() {
  console.log("🔄 Starting personal code update to 8-digit format...");

  try {
    // Get all users with existing personal codes
    const usersWithPersonalCodes = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        personalCode: users.personalCode,
      })
      .from(users)
      .where(isNotNull(users.personalCode));

    console.log(
      `📊 Found ${usersWithPersonalCodes.length} users with existing personal codes`
    );

    if (usersWithPersonalCodes.length === 0) {
      console.log("✅ No users with personal codes found!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const user of usersWithPersonalCodes) {
      try {
        // Check if the personal code is already in the new 8-digit format
        if (
          user.personalCode?.length === 8 &&
          /^[A-Z0-9]+$/.test(user.personalCode.toUpperCase()) &&
          user.personalCode.match(/[A-Z]/g)?.length === 4 &&
          user.personalCode.match(/[0-9]/g)?.length === 4
        ) {
          console.log(
            `⏭️  User ${user.email} already has 8-digit personal code: ${user.personalCode}`
          );
          skippedCount++;
          continue;
        }

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

        // Generate new personal code in the new 8-digit format
        const newPersonalCode = createPersonalCode(
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

        // Update user with new personal code
        await db
          .update(users)
          .set({ personalCode: newPersonalCode })
          .where(eq(users.id, user.id));

        console.log(`✅ Updated ${user.email}:`);
        console.log(`   Old: ${user.personalCode}`);
        console.log(`   New: ${newPersonalCode}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error updating personal code for ${user.email}:`,
          error
        );
        errorCount++;
      }
    }

    console.log("\n📈 Update Summary:");
    console.log(`✅ Successfully updated: ${successCount} personal codes`);
    console.log(`⏭️  Skipped (already 8-digit format): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(
      `📊 Total processed: ${successCount + skippedCount + errorCount}`
    );
  } catch (error) {
    console.error("💥 Update failed:", error);
    process.exit(1);
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updatePersonalCodesToEightDigitFormat()
    .then(() => {
      console.log("🎉 Personal code update to 8-digit format completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Update failed:", error);
      process.exit(1);
    });
}

export { updatePersonalCodesToEightDigitFormat };

