// This file will contain your Drizzle client instance and connection logic.

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as schema from "./schema"; // Import your schema

dotenv.config(); // Load env vars from root .env file, adjust path if needed

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: process.env.NODE_ENV === 'production', // Enable SSL in production if needed
});

// Create the Drizzle instance
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV !== "production",
}); // Enable logging in dev

// Export the schema along with the db client
export * as schema from "./schema";
