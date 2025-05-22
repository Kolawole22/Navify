"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = __importStar(require("./schema.js"));
const schema_js_1 = require("./schema.js");
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
// import { fileURLToPath } from "url";
const dotenv_1 = __importDefault(require("dotenv"));
// Derive __dirname equivalents for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// Load environment variables from .env file
dotenv_1.default.config({
  path: path_1.default.resolve(__dirname, "../../.env"),
}); // Now __dirname is defined
// Basic State to ISO Code Mapping (Expand or verify as needed)
const stateCodeMap = {
  Abia: "AB",
  Adamawa: "AD",
  "Akwa Ibom": "AK",
  Anambra: "AN",
  Bauchi: "BA",
  Bayelsa: "BY",
  Benue: "BE",
  Borno: "BO",
  "Cross River": "CR",
  Delta: "DE",
  Ebonyi: "EB",
  Edo: "ED",
  Ekiti: "EK",
  Enugu: "EN",
  FCT: "FC", // Federal Capital Territory
  Gombe: "GO",
  Imo: "IM",
  Jigawa: "JI",
  Kaduna: "KD",
  Kano: "KN",
  Katsina: "KT",
  Kebbi: "KE",
  Kogi: "KO",
  Kwara: "KW",
  Lagos: "LA",
  Nasarawa: "NA",
  Niger: "NI",
  Ogun: "OG",
  Ondo: "ON",
  Osun: "OS",
  Oyo: "OY",
  Plateau: "PL",
  Rivers: "RI",
  Sokoto: "SO",
  Taraba: "TA",
  Yobe: "YO",
  Zamfara: "ZA",
};
async function seedDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }
  console.log("Connecting to database...");
  const pool = new pg_1.Pool({ connectionString });
  const db = (0, node_postgres_1.drizzle)(pool, { schema });
  console.log("Reading state and LGA data...");
  const dataPath = path_1.default.join(
    __dirname,
    "../data/nigeria-states-lgas.json"
  );
  let stateLgaData;
  try {
    const rawData = fs.readFileSync(dataPath, "utf-8");
    stateLgaData = JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading or parsing ${dataPath}:`, error);
    await pool.end();
    return;
  }
  console.log("Starting seeding process...");
  // --- Seed States ---
  console.log("Seeding states...");
  const statesToInsert = [];
  for (const stateName in stateLgaData) {
    const stateCode = stateCodeMap[stateName];
    if (!stateCode) {
      console.warn(
        `Warning: No ISO code found for state: ${stateName}. Skipping.`
      );
      continue;
    }
    statesToInsert.push({ name: stateName, code: stateCode });
  }
  if (statesToInsert.length > 0) {
    try {
      // Use onConflictDoNothing to avoid errors if states already exist
      await db
        .insert(schema_js_1.states)
        .values(statesToInsert)
        .onConflictDoNothing();
      console.log(`Processed ${statesToInsert.length} states.`);
    } catch (error) {
      console.error("Error seeding states:", error);
      await pool.end();
      return;
    }
  } else {
    console.log("No new states to insert.");
  }
  // --- Seed LGAs ---
  console.log("Seeding LGAs...");
  const lgasToInsert = [];
  let lgaCounter = {};
  for (const stateName in stateLgaData) {
    const stateCode = stateCodeMap[stateName];
    if (!stateCode) {
      continue; // Already warned above
    }
    const lgaList = stateLgaData[stateName];
    if (!lgaList || !Array.isArray(lgaList)) {
      console.warn(
        `Warning: Invalid or missing LGA list for state: ${stateName}. Skipping.`
      );
      continue;
    }
    lgaCounter[stateCode] = 1; // Reset counter for each state
    for (const lgaName of lgaList) {
      if (!lgaName || typeof lgaName !== "string") {
        console.warn(
          `Warning: Invalid LGA name found in ${stateName}: ${lgaName}. Skipping.`
        );
        continue;
      }
      // Generate 3-digit padded code
      const lgaCode = `${stateCode}${lgaCounter[stateCode]
        .toString()
        .padStart(3, "0")}`;
      lgasToInsert.push({
        name: lgaName.trim(), // Trim whitespace
        code: lgaCode,
        stateCode: stateCode,
      });
      lgaCounter[stateCode]++;
    }
  }
  if (lgasToInsert.length > 0) {
    try {
      console.log(`Attempting to insert ${lgasToInsert.length} LGAs...`);
      // Use onConflictDoNothing based on the unique index (stateCode, code)
      await db
        .insert(schema_js_1.lgas)
        .values(lgasToInsert)
        .onConflictDoNothing({
          target: [schema_js_1.lgas.stateCode, schema_js_1.lgas.code], // Specify target for conflict resolution
        });
      console.log(`Seeded LGAs.`);
    } catch (error) {
      console.error("Error seeding LGAs:", error);
      // Consider logging which specific LGA failed if possible
    }
  } else {
    console.log("No new LGAs to insert.");
  }
  console.log("Seeding process finished.");
  await pool.end(); // Close the connection pool
}
seedDatabase().catch((err) => {
  console.error("Seeding script failed:", err);
  process.exit(1);
});
//# sourceMappingURL=seed.js.map
