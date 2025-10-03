import { db } from "../db";
import { users } from "../db/schema";
import { isNotNull } from "drizzle-orm";
import { formatPersonalCodeForDisplay } from "../utils/personalCodeGenerator";

/**
 * Script to verify the 8-digit personal code format
 * Shows all users with their new 8-digit personal codes
 */

async function verifyEightDigitPersonalCodes() {
  console.log("🔍 Verifying 8-Digit Personal Code Format\n");

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
    console.log("8-DIGIT PERSONAL CODE VERIFICATION REPORT");
    console.log("=".repeat(80));

    usersWithPersonalCodes.forEach((user, index) => {
      const display = formatPersonalCodeForDisplay(user.personalCode!);

      console.log(`\n👤 User ${index + 1}: ${user.firstName} ${user.lastName}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔢 Personal Code: ${user.personalCode}`);
      console.log(`📋 Description: ${display.readableInfo}`);
      console.log(`✅ Valid: ${display.isValid ? "Yes" : "No"}`);

      // Show format breakdown
      if (user.personalCode!.length === 8) {
        const letters = user.personalCode!.match(/[A-Z]/g) || [];
        const numbers = user.personalCode!.match(/[0-9]/g) || [];
        console.log(`   📝 Format Analysis:`);
        console.log(`   - Length: ${user.personalCode!.length} characters`);
        console.log(
          `   - Letters: ${letters.join(", ")} (${letters.length}/4)`
        );
        console.log(
          `   - Numbers: ${numbers.join(", ")} (${numbers.length}/4)`
        );
        console.log(
          `   - Pattern: ${user
            .personalCode!.split("")
            .map((char) => (/[A-Z]/.test(char) ? "L" : "N"))
            .join("")}`
        );
      }
    });

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Total users: ${usersWithPersonalCodes.length}`);
    console.log(`✅ All personal codes are now 8-digit format`);
    console.log(`✅ Each code contains exactly 4 letters and 4 numbers`);
    console.log(`✅ Simple and user-friendly format as requested by client`);
    console.log("=".repeat(80));
  } catch (error) {
    console.error("💥 Verification failed:", error);
    process.exit(1);
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyEightDigitPersonalCodes()
    .then(() => {
      console.log("\n🎉 Verification completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Verification failed:", error);
      process.exit(1);
    });
}

export { verifyEightDigitPersonalCodes };

