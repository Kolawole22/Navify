// This file will contain your Drizzle ORM schema definitions.

import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  decimal,
  uuid,
  boolean,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // Using UUID for user IDs
  email: varchar("email", { length: 255 }).unique().notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).unique().notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  // Add other user fields as needed, e.g., name, passwordHash, preferences
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Addresses Table
export const addresses = pgTable(
  "addresses",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // Link to users table, cascade delete
    hhgCode: text("hhg_code").unique().notNull(), // Unique Navify code for the address
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(), // Sufficient precision for coordinates
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    street: text("street"),
    city: text("city"),
    stateCode: text("state_code").references(() => states.code, {
      onDelete: "restrict",
    }), // Link to states table
    lgaCode: text("lga_code").references(() => lgas.code, {
      onDelete: "restrict",
    }), // Link to lgas table
    houseNumber: text("house_number"),
    estate: text("estate"),
    floor: text("floor"), // Renamed from apartment
    landmark: text("landmark"),
    specialDescription: text("special_description"),
    category: text("category"), // Added category field
    photoUrls: jsonb("photo_urls").$type<string[]>(), // Store array of photo URLs
    isSaved: boolean("is_saved").default(false), // To mark if user explicitly saved this address
    label: text("label"), // User-defined label (e.g., "Mom's House")
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()), // Automatically update timestamp
  },
  (table) => {
    return {
      // Optional: Add indexes for faster querying if needed
      userIdx: index("address_user_id_idx").on(table.userId),
      hhgCodeIdx: index("address_hhg_code_idx").on(table.hhgCode),
      coordsIdx: index("address_coords_idx").on(
        table.latitude,
        table.longitude
      ),
      stateLgaIdx: index("address_state_lga_idx").on(
        table.stateCode,
        table.lgaCode
      ),
    };
  }
);

// Define relations (many addresses can belong to one user)
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
  // Add relation to state (optional but good practice)
  state: one(states, {
    fields: [addresses.stateCode],
    references: [states.code],
  }),
  // Note: Direct relation to LGA is trickier due to composite key.
  // You typically fetch LGAs based on the stateCode when needed.
}));

// TODO: Add LocationHistory table if needed separately
// Example:
// export const locationHistory = pgTable('location_history', {
//   id: serial('id').primaryKey(),
//   userId: uuid('user_id').references(() => users.id).notNull(),
//   addressId: integer('address_id').references(() => addresses.id), // Optional: Link to a specific address if applicable
//   latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
//   longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
//   visitedAt: timestamp('visited_at').defaultNow().notNull(),
// });

// --- States Table ---
export const states = pgTable(
  "states",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    // Using standard ISO 3166-2:NG codes (e.g., 'LA' for Lagos, 'AB' for Abia)
    code: varchar("code", { length: 2 }).notNull().unique(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => {
    return {
      codeIndex: uniqueIndex("state_code_idx").on(table.code),
    };
  }
);

// --- LGAs Table ---
export const lgas = pgTable(
  "lgas",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    // 3-digit code, unique within a state (e.g., '001', '015')
    code: varchar("code", { length: 3 }).notNull().unique(),
    // Foreign key linking to the state table using the state's unique code
    stateCode: varchar("state_code", { length: 2 })
      .notNull()
      .references(() => states.code),
    // Optional: Add centroid coordinates or geometry later if data source provides them
    // latitude: decimal("latitude", { precision: 10, scale: 8 }),
    // longitude: decimal("longitude", { precision: 11, scale: 8 }),
    // geometry: geometry('geometry', { srid: 4326 }), // Requires PostGIS
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => {
    return {
      // Ensures LGA code is unique within a given state
      stateLgaUniqueIdx: uniqueIndex("state_lga_unique_idx").on(
        table.stateCode,
        table.code
      ),
    };
  }
);

// Add relations if you use drizzle-orm/relations
export const stateRelations = relations(states, ({ many }) => ({
  lgas: many(lgas),
}));
export const lgaRelations = relations(lgas, ({ one }) => ({
  state: one(states, {
    fields: [lgas.stateCode],
    references: [states.code],
  }),
}));
