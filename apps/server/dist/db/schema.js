"use strict";
// This file will contain your Drizzle ORM schema definitions.
Object.defineProperty(exports, "__esModule", { value: true });
exports.lgaRelations =
  exports.stateRelations =
  exports.lgas =
  exports.states =
  exports.addressesRelations =
  exports.usersRelations =
  exports.addresses =
  exports.users =
    void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
// Users Table
exports.users = (0, pg_core_1.pgTable)("users", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(), // Using UUID for user IDs
  email: (0, pg_core_1.varchar)("email", { length: 255 }).unique().notNull(),
  phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 })
    .unique()
    .notNull(),
  firstName: (0, pg_core_1.varchar)("first_name", { length: 255 }).notNull(),
  lastName: (0, pg_core_1.varchar)("last_name", { length: 255 }).notNull(),
  passwordHash: (0, pg_core_1.varchar)("password_hash", {
    length: 255,
  }).notNull(),
  // Add other user fields as needed, e.g., name, passwordHash, preferences
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Addresses Table
exports.addresses = (0, pg_core_1.pgTable)(
  "addresses",
  {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id, {
      onDelete: "cascade",
    }), // Link to users table, cascade delete
    hhgCode: (0, pg_core_1.text)("hhg_code").unique().notNull(), // Unique Navify code for the address
    latitude: (0, pg_core_1.decimal)("latitude", {
      precision: 10,
      scale: 8,
    }).notNull(), // Sufficient precision for coordinates
    longitude: (0, pg_core_1.decimal)("longitude", {
      precision: 11,
      scale: 8,
    }).notNull(),
    street: (0, pg_core_1.text)("street"),
    city: (0, pg_core_1.text)("city"),
    stateCode: (0, pg_core_1.text)("state_code").references(
      () => exports.states.code,
      {
        onDelete: "restrict",
      }
    ), // Link to states table
    lgaCode: (0, pg_core_1.text)("lga_code").references(
      () => exports.lgas.code,
      {
        onDelete: "restrict",
      }
    ), // Link to lgas table
    houseNumber: (0, pg_core_1.text)("house_number"),
    estate: (0, pg_core_1.text)("estate"),
    floor: (0, pg_core_1.text)("floor"), // Renamed from apartment
    landmark: (0, pg_core_1.text)("landmark"),
    specialDescription: (0, pg_core_1.text)("special_description"),
    category: (0, pg_core_1.text)("category"), // Added category field
    photoUrls: (0, pg_core_1.jsonb)("photo_urls").$type(), // Store array of photo URLs
    isSaved: (0, pg_core_1.boolean)("is_saved").default(false), // To mark if user explicitly saved this address
    label: (0, pg_core_1.text)("label"), // User-defined label (e.g., "Mom's House")
    createdAt: (0, pg_core_1.timestamp)("created_at", {
      withTimezone: true,
    }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()), // Automatically update timestamp
  },
  (table) => {
    return {
      // Optional: Add indexes for faster querying if needed
      userIdx: (0, pg_core_1.index)("address_user_id_idx").on(table.userId),
      hhgCodeIdx: (0, pg_core_1.index)("address_hhg_code_idx").on(
        table.hhgCode
      ),
      coordsIdx: (0, pg_core_1.index)("address_coords_idx").on(
        table.latitude,
        table.longitude
      ),
      stateLgaIdx: (0, pg_core_1.index)("address_state_lga_idx").on(
        table.stateCode,
        table.lgaCode
      ),
    };
  }
);
// Define relations (many addresses can belong to one user)
exports.usersRelations = (0, drizzle_orm_1.relations)(
  exports.users,
  ({ many }) => ({
    addresses: many(exports.addresses),
  })
);
exports.addressesRelations = (0, drizzle_orm_1.relations)(
  exports.addresses,
  ({ one }) => ({
    user: one(exports.users, {
      fields: [exports.addresses.userId],
      references: [exports.users.id],
    }),
    // Add relation to state (optional but good practice)
    state: one(exports.states, {
      fields: [exports.addresses.stateCode],
      references: [exports.states.code],
    }),
    // Note: Direct relation to LGA is trickier due to composite key.
    // You typically fetch LGAs based on the stateCode when needed.
  })
);
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
exports.states = (0, pg_core_1.pgTable)(
  "states",
  {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    // Using standard ISO 3166-2:NG codes (e.g., 'LA' for Lagos, 'AB' for Abia)
    code: (0, pg_core_1.varchar)("code", { length: 2 }).notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at")
      .default((0, drizzle_orm_1.sql)`now()`)
      .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
      .default((0, drizzle_orm_1.sql)`now()`)
      .notNull(),
  },
  (table) => {
    return {
      codeIndex: (0, pg_core_1.uniqueIndex)("state_code_idx").on(table.code),
    };
  }
);
// --- LGAs Table ---
exports.lgas = (0, pg_core_1.pgTable)(
  "lgas",
  {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 150 }).notNull(),
    // 3-digit code, unique within a state (e.g., '001', '015')
    code: (0, pg_core_1.varchar)("code", { length: 5 }).notNull().unique(),
    // Foreign key linking to the state table using the state's unique code
    stateCode: (0, pg_core_1.varchar)("state_code", { length: 2 })
      .notNull()
      .references(() => exports.states.code),
    // Optional: Add centroid coordinates or geometry later if data source provides them
    // latitude: decimal("latitude", { precision: 10, scale: 8 }),
    // longitude: decimal("longitude", { precision: 11, scale: 8 }),
    // geometry: geometry('geometry', { srid: 4326 }), // Requires PostGIS
    createdAt: (0, pg_core_1.timestamp)("created_at")
      .default((0, drizzle_orm_1.sql)`now()`)
      .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
      .default((0, drizzle_orm_1.sql)`now()`)
      .notNull(),
  },
  (table) => {
    return {
      // Ensures LGA code is unique within a given state
      stateLgaUniqueIdx: (0, pg_core_1.uniqueIndex)("state_lga_unique_idx").on(
        table.stateCode,
        table.code
      ),
    };
  }
);
// Add relations if you use drizzle-orm/relations
exports.stateRelations = (0, drizzle_orm_1.relations)(
  exports.states,
  ({ many }) => ({
    lgas: many(exports.lgas),
  })
);
exports.lgaRelations = (0, drizzle_orm_1.relations)(
  exports.lgas,
  ({ one }) => ({
    state: one(exports.states, {
      fields: [exports.lgas.stateCode],
      references: [exports.states.code],
    }),
  })
);
//# sourceMappingURL=schema.js.map
