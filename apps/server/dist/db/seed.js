"use strict";
// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";
// import * as schema from "./schema.js";
// import { states, lgas } from "./schema.js";
// import * as fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// // Derive __dirname equivalents for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// // Load environment variables from .env file
// dotenv.config({ path: path.resolve(__dirname, "../../.env") }); // Now __dirname is defined
// // Basic State to ISO Code Mapping (Expand or verify as needed)
// const stateCodeMap: { [key: string]: string } = {
//   Abia: "AB",
//   Adamawa: "AD",
//   "Akwa Ibom": "AK",
//   Anambra: "AN",
//   Bauchi: "BA",
//   Bayelsa: "BY",
//   Benue: "BE",
//   Borno: "BO",
//   "Cross River": "CR",
//   Delta: "DE",
//   Ebonyi: "EB",
//   Edo: "ED",
//   Ekiti: "EK",
//   Enugu: "EN",
//   FCT: "FC", // Federal Capital Territory
//   Gombe: "GO",
//   Imo: "IM",
//   Jigawa: "JI",
//   Kaduna: "KD",
//   Kano: "KN",
//   Katsina: "KT",
//   Kebbi: "KE",
//   Kogi: "KO",
//   Kwara: "KW",
//   Lagos: "LA",
//   Nasarawa: "NA",
//   Niger: "NI",
//   Ogun: "OG",
//   Ondo: "ON",
//   Osun: "OS",
//   Oyo: "OY",
//   Plateau: "PL",
//   Rivers: "RI",
//   Sokoto: "SO",
//   Taraba: "TA",
//   Yobe: "YO",
//   Zamfara: "ZA",
// };
// // Type for the expected JSON structure from the gist
// interface StateLgaData {
//   [stateName: string]: string[];
// }
// async function seedDatabase() {
//   const connectionString = process.env.DATABASE_URL;
//   if (!connectionString) {
//     throw new Error("DATABASE_URL environment variable is not set.");
//   }
//   console.log("Connecting to database...");
//   const pool = new Pool({ connectionString });
//   const db = drizzle(pool, { schema });
//   console.log("Reading state and LGA data...");
//   const dataPath = path.join(__dirname, "../data/nigeria-states-lgas.json");
//   let stateLgaData: StateLgaData;
//   try {
//     const rawData = fs.readFileSync(dataPath, "utf-8");
//     stateLgaData = JSON.parse(rawData);
//   } catch (error) {
//     console.error(`Error reading or parsing ${dataPath}:`, error);
//     await pool.end();
//     return;
//   }
//   console.log("Starting seeding process...");
//   // --- Seed States ---
//   console.log("Seeding states...");
//   const statesToInsert: (typeof states.$inferInsert)[] = [];
//   for (const stateName in stateLgaData) {
//     const stateCode = stateCodeMap[stateName];
//     if (!stateCode) {
//       console.warn(
//         `Warning: No ISO code found for state: ${stateName}. Skipping.`
//       );
//       continue;
//     }
//     statesToInsert.push({ name: stateName, code: stateCode });
//   }
//   if (statesToInsert.length > 0) {
//     try {
//       // Use onConflictDoNothing to avoid errors if states already exist
//       await db.insert(states).values(statesToInsert).onConflictDoNothing();
//       console.log(`Processed ${statesToInsert.length} states.`);
//     } catch (error) {
//       console.error("Error seeding states:", error);
//       await pool.end();
//       return;
//     }
//   } else {
//     console.log("No new states to insert.");
//   }
//   // --- Seed LGAs ---
//   console.log("Seeding LGAs...");
//   const lgasToInsert: (typeof lgas.$inferInsert)[] = [];
//   let lgaCounter: { [stateCode: string]: number } = {};
//   for (const stateName in stateLgaData) {
//     const stateCode = stateCodeMap[stateName];
//     if (!stateCode) {
//       continue; // Already warned above
//     }
//     const lgaList = stateLgaData[stateName];
//     if (!lgaList || !Array.isArray(lgaList)) {
//       console.warn(
//         `Warning: Invalid or missing LGA list for state: ${stateName}. Skipping.`
//       );
//       continue;
//     }
//     lgaCounter[stateCode] = 1; // Reset counter for each state
//     for (const lgaName of lgaList) {
//       if (!lgaName || typeof lgaName !== "string") {
//         console.warn(
//           `Warning: Invalid LGA name found in ${stateName}: ${lgaName}. Skipping.`
//         );
//         continue;
//       }
//       // Generate 3-digit padded code
//       const lgaCode = lgaCounter[stateCode].toString().padStart(3, "0");
//       lgasToInsert.push({
//         name: lgaName.trim(), // Trim whitespace
//         code: lgaCode,
//         stateCode: stateCode,
//       });
//       lgaCounter[stateCode]++;
//     }
//   }
//   if (lgasToInsert.length > 0) {
//     try {
//       console.log(`Attempting to insert ${lgasToInsert.length} LGAs...`);
//       // Use onConflictDoNothing based on the unique index (stateCode, code)
//       await db
//         .insert(lgas)
//         .values(lgasToInsert)
//         .onConflictDoNothing({
//           target: [lgas.stateCode, lgas.code], // Specify target for conflict resolution
//         });
//       console.log(`Seeded LGAs.`);
//     } catch (error) {
//       console.error("Error seeding LGAs:", error);
//       // Consider logging which specific LGA failed if possible
//     }
//   } else {
//     console.log("No new LGAs to insert.");
//   }
//   console.log("Seeding process finished.");
//   await pool.end(); // Close the connection pool
// }
// seedDatabase().catch((err) => {
//   console.error("Seeding script failed:", err);
//   process.exit(1);
// });
//# sourceMappingURL=seed.js.map