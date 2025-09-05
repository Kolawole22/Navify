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
  integer,
} from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // Using UUID for user IDs
  email: varchar("email", { length: 255 }).unique().notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).unique().notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  personalCode: text("personal_code").unique(), // Personal code tied to user
  preferences: jsonb("preferences").$type<Record<string, any>>().default({}), // User settings/preferences
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
    hhgCode: text("hhg_code").unique().notNull(), // Digital Door Code (DDC) for the address
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
    // New DDC component fields
    areaType: text("area_type"), // STR, Z, or LMK
    areaCode: text("area_code"), // Area identifier code
    locationNumber: text("location_number"), // 4-digit unique location number
    houseNumber: text("house_number"),
    estate: text("estate"),
    floor: text("floor"), // Renamed from apartment
    landmark: text("landmark"),
    specialDescription: text("special_description"),
    category: text("category"), // Added category field
    photoUrls: jsonb("photo_urls").$type<string[]>(), // Store array of photo URLs
    qrCodeImageUrl: text("qr_code_image_url"), // URL to the generated QR code image
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
    code: varchar("code", { length: 5 }).notNull().unique(),
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

// --- Address Categories Table ---
export const addressCategories = pgTable("address_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

// Define all relations after all tables are defined
export const addressCategoriesRelations = relations(
  addressCategories,
  ({ many }) => ({
    addresses: many(addresses),
  })
);

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
  // Add relation to category
  category: one(addressCategories, {
    fields: [addresses.category],
    references: [addressCategories.id],
  }),
  // Note: Direct relation to LGA is trickier due to composite key.
  // You typically fetch LGAs based on the stateCode when needed.
}));

export const addressBookmarks = pgTable("address_bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addressId: serial("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Location History Table
export const locationHistory = pgTable("location_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addressId: serial("address_id").references(() => addresses.id, {
    onDelete: "set null",
  }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  activity: text("activity"), // 'search', 'navigation', 'visit'
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional data like transport mode, duration, etc.
});

// User Sessions Table (for password reset, etc.)
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  type: text("type").notNull(), // 'password_reset', 'email_verification', 'phone_verification'
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'system', 'address_shared', 'navigation'
  read: boolean("read").default(false),
  data: jsonb("data").$type<Record<string, any>>(), // Additional notification data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Address Sharing Table
export const addressShares = pgTable("address_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  addressId: serial("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "cascade" }),
  sharedBy: uuid("shared_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWith: uuid("shared_with").references(() => users.id, {
    onDelete: "cascade",
  }),
  shareCode: text("share_code").unique().notNull(), // For QR codes and links
  expiresAt: timestamp("expires_at"),
  viewed: boolean("viewed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Offline Maps Table
export const offlineMaps = pgTable("offline_maps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  region: jsonb("region")
    .$type<{
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }>()
    .notNull(),
  size: integer("size"), // Size in bytes
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // When the map data expires
});

// Address Ratings Table
export const addressRatings = pgTable("address_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  addressId: serial("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  helpful: integer("helpful").default(0), // Number of helpful votes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Search History Table
export const searchHistory = pgTable("search_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  results: integer("results").default(0), // Number of results found
  selectedResult: serial("selected_result").references(() => addresses.id, {
    onDelete: "set null",
  }),
  searchAt: timestamp("search_at").defaultNow().notNull(),
});

// Define additional relations
export const locationHistoryRelations = relations(
  locationHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [locationHistory.userId],
      references: [users.id],
    }),
    address: one(addresses, {
      fields: [locationHistory.addressId],
      references: [addresses.id],
    }),
  })
);

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const addressSharesRelations = relations(addressShares, ({ one }) => ({
  address: one(addresses, {
    fields: [addressShares.addressId],
    references: [addresses.id],
  }),
  sharedBy: one(users, {
    fields: [addressShares.sharedBy],
    references: [users.id],
  }),
  sharedWith: one(users, {
    fields: [addressShares.sharedWith],
    references: [users.id],
  }),
}));

export const offlineMapsRelations = relations(offlineMaps, ({ one }) => ({
  user: one(users, {
    fields: [offlineMaps.userId],
    references: [users.id],
  }),
}));

export const addressRatingsRelations = relations(addressRatings, ({ one }) => ({
  address: one(addresses, {
    fields: [addressRatings.addressId],
    references: [addresses.id],
  }),
  user: one(users, {
    fields: [addressRatings.userId],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
  selectedResult: one(addresses, {
    fields: [searchHistory.selectedResult],
    references: [addresses.id],
  }),
}));
