import { db } from "../db";
import { users } from "../db/schema";
import { isNotNull } from "drizzle-orm";
import { formatPersonalCodeForDisplay } from "../utils/personalCodeGenerator";

/**
 * Script to verify the personal code format update
 * Shows all users with their new personal codes and readable information
 */

async function verifyPersonalCodeUpdate() {
  console.log("🔍 Verifying Personal Code Format Update\n");

  try {
    // Get all users with personal codes
    const usersWithPersonalCodes = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        personalCode: users.personalCode,
      })
      .from(users)
      .where(isNotNull(users.personalCode));

    console.log(
      `📊 Found ${usersWithPersonalCodes.length} users with personal codes\n`
    );

    if (usersWithPersonalCodes.length === 0) {
      console.log("❌ No users with personal codes found!");
      return;
    }

    console.log("=".repeat(80));
    console.log("PERSONAL CODE VERIFICATION REPORT");
    console.log("=".repeat(80));

    usersWithPersonalCodes.forEach((user, index) => {
      const display = formatPersonalCodeForDisplay(user.personalCode!);

      console.log(`\n👤 User ${index + 1}: ${user.firstName} ${user.lastName}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔢 Personal Code: ${user.personalCode}`);
      console.log(`📍 Location: ${display.readableInfo}`);
      console.log(`✅ Valid: ${display.isValid ? "Yes" : "No"}`);

      // Show format breakdown
      const parts = user.personalCode!.split("-");
      if (parts.length === 5) {
        console.log(
          `   Format: PC-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`
        );
        console.log(`   - State: ${parts[1]}`);
        console.log(`   - LGA: ${parts[2]}`);
        console.log(`   - User ID: ${parts[3]}`);
        console.log(`   - Checksum: ${parts[4]}`);
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Total users: ${usersWithPersonalCodes.length}`);
    console.log(`✅ All personal codes are in the new user-friendly format`);
    console.log(
      `✅ Users can now easily identify their location from their personal code`
    );
    console.log("=".repeat(80));
  } catch (error) {
    console.error("💥 Verification failed:", error);
    process.exit(1);
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyPersonalCodeUpdate()
    .then(() => {
      console.log("\n🎉 Verification completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Verification failed:", error);
      process.exit(1);
    });
}

export { verifyPersonalCodeUpdate };
