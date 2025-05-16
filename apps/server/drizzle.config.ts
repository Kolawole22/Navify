import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" }); // Adjust the path if your .env file is located elsewhere

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations
  dialect: "postgresql", // Specify the dialect
  dbCredentials: {
    // You'll need to set the DATABASE_URL environment variable
    // Example: postgresql://user:password@host:port/database
    url: process.env.DATABASE_URL!,
  },
  // Optional: Specify paths to ignore for schema generation
  // exclude: [],
  // Optional: Verbose logging
  // verbose: true,
  // Optional: Strict mode
  // strict: true,
} satisfies Config;
