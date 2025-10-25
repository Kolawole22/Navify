"use strict";
// This file will contain your Drizzle ORM schema definitions.
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveLocationUpdatesRelations = exports.liveLocationSharesRelations = exports.liveLocationSessionsRelations = exports.liveLocationUpdates = exports.liveLocationShares = exports.liveLocationSessions = exports.searchHistoryRelations = exports.addressRatingsRelations = exports.offlineMapsRelations = exports.addressSharesRelations = exports.notificationsRelations = exports.userSessionsRelations = exports.locationHistoryRelations = exports.searchHistory = exports.addressRatings = exports.offlineMaps = exports.addressShares = exports.notifications = exports.userSessions = exports.locationHistory = exports.addressBookmarks = exports.addressesRelations = exports.addressCategoriesRelations = exports.addressCategories = exports.lgaRelations = exports.stateRelations = exports.lgas = exports.states = exports.usersRelations = exports.addresses = exports.users = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
// Users Table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(), // Using UUID for user IDs
    email: (0, pg_core_1.varchar)("email", { length: 255 }).unique().notNull(),
    phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 }).unique().notNull(),
    firstName: (0, pg_core_1.varchar)("first_name", { length: 255 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 255 }).notNull(),
    passwordHash: (0, pg_core_1.varchar)("password_hash", { length: 255 }).notNull(),
    personalCode: (0, pg_core_1.text)("personal_code").unique(), // Personal code tied to user
    preferences: (0, pg_core_1.jsonb)("preferences").$type().default({}), // User settings/preferences
    // Add other user fields as needed, e.g., name, passwordHash, preferences
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Addresses Table
exports.addresses = (0, pg_core_1.pgTable)("addresses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.users.id, { onDelete: "cascade" }), // Link to users table, cascade delete
    hhgCode: (0, pg_core_1.text)("hhg_code").unique().notNull(), // Digital Door Code (DDC) for the address
    latitude: (0, pg_core_1.decimal)("latitude", { precision: 10, scale: 8 }).notNull(), // Sufficient precision for coordinates
    longitude: (0, pg_core_1.decimal)("longitude", { precision: 11, scale: 8 }).notNull(),
    street: (0, pg_core_1.text)("street"),
    city: (0, pg_core_1.text)("city"),
    stateCode: (0, pg_core_1.text)("state_code").references(() => exports.states.code, {
        onDelete: "restrict",
    }), // Link to states table
    lgaCode: (0, pg_core_1.text)("lga_code").references(() => exports.lgas.code, {
        onDelete: "restrict",
    }), // Link to lgas table
    // New DDC component fields
    areaType: (0, pg_core_1.text)("area_type"), // STR, Z, or LMK
    areaCode: (0, pg_core_1.text)("area_code"), // Area identifier code
    locationNumber: (0, pg_core_1.text)("location_number"), // 4-digit unique location number
    houseNumber: (0, pg_core_1.text)("house_number"), // User-provided house number
    generatedHouseNumber: (0, pg_core_1.text)("generated_house_number"), // Grid-based generated house number
    h3Index: (0, pg_core_1.text)("h3_index"), // H3 cell identifier for spatial queries
    h3Resolution: (0, pg_core_1.integer)("h3_resolution").default(12), // Grid resolution used
    estate: (0, pg_core_1.text)("estate"),
    floor: (0, pg_core_1.text)("floor"), // Renamed from apartment
    landmark: (0, pg_core_1.text)("landmark"),
    specialDescription: (0, pg_core_1.text)("special_description"),
    category: (0, pg_core_1.text)("category"), // Added category field
    photoUrls: (0, pg_core_1.jsonb)("photo_urls").$type(), // Store array of photo URLs
    qrCodeImageUrl: (0, pg_core_1.text)("qr_code_image_url"), // URL to the generated QR code image
    isSaved: (0, pg_core_1.boolean)("is_saved").default(false), // To mark if user explicitly saved this address
    label: (0, pg_core_1.text)("label"), // User-defined label (e.g., "Mom's House")
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date()), // Automatically update timestamp
}, (table) => {
    return {
        // Optional: Add indexes for faster querying if needed
        userIdx: (0, pg_core_1.index)("address_user_id_idx").on(table.userId),
        hhgCodeIdx: (0, pg_core_1.index)("address_hhg_code_idx").on(table.hhgCode),
        coordsIdx: (0, pg_core_1.index)("address_coords_idx").on(table.latitude, table.longitude),
        stateLgaIdx: (0, pg_core_1.index)("address_state_lga_idx").on(table.stateCode, table.lgaCode),
        h3IndexIdx: (0, pg_core_1.index)("addresses_h3_index_idx").on(table.h3Index),
        generatedHouseNumberIdx: (0, pg_core_1.index)("addresses_generated_house_number_idx").on(table.generatedHouseNumber),
    };
});
// Define relations (many addresses can belong to one user)
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    addresses: many(exports.addresses),
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
exports.states = (0, pg_core_1.pgTable)("states", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull().unique(),
    // Using standard ISO 3166-2:NG codes (e.g., 'LA' for Lagos, 'AB' for Abia)
    code: (0, pg_core_1.varchar)("code", { length: 2 }).notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at")
        .default((0, drizzle_orm_1.sql) `now()`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .default((0, drizzle_orm_1.sql) `now()`)
        .notNull(),
}, (table) => {
    return {
        codeIndex: (0, pg_core_1.uniqueIndex)("state_code_idx").on(table.code),
    };
});
// --- LGAs Table ---
exports.lgas = (0, pg_core_1.pgTable)("lgas", {
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
        .default((0, drizzle_orm_1.sql) `now()`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .default((0, drizzle_orm_1.sql) `now()`)
        .notNull(),
}, (table) => {
    return {
        // Ensures LGA code is unique within a given state
        stateLgaUniqueIdx: (0, pg_core_1.uniqueIndex)("state_lga_unique_idx").on(table.stateCode, table.code),
    };
});
// Add relations if you use drizzle-orm/relations
exports.stateRelations = (0, drizzle_orm_1.relations)(exports.states, ({ many }) => ({
    lgas: many(exports.lgas),
}));
exports.lgaRelations = (0, drizzle_orm_1.relations)(exports.lgas, ({ one }) => ({
    state: one(exports.states, {
        fields: [exports.lgas.stateCode],
        references: [exports.states.code],
    }),
}));
// --- Address Categories Table ---
exports.addressCategories = (0, pg_core_1.pgTable)("address_categories", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    label: (0, pg_core_1.text)("label").notNull(),
    description: (0, pg_core_1.text)("description"),
    createdAt: (0, pg_core_1.timestamp)("created_at")
        .default((0, drizzle_orm_1.sql) `now()`)
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at")
        .default((0, drizzle_orm_1.sql) `now()`)
        .notNull(),
});
// Define all relations after all tables are defined
exports.addressCategoriesRelations = (0, drizzle_orm_1.relations)(exports.addressCategories, ({ many }) => ({
    addresses: many(exports.addresses),
}));
exports.addressesRelations = (0, drizzle_orm_1.relations)(exports.addresses, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.addresses.userId],
        references: [exports.users.id],
    }),
    // Add relation to state (optional but good practice)
    state: one(exports.states, {
        fields: [exports.addresses.stateCode],
        references: [exports.states.code],
    }),
    // Add relation to category
    category: one(exports.addressCategories, {
        fields: [exports.addresses.category],
        references: [exports.addressCategories.id],
    }),
    // Note: Direct relation to LGA is trickier due to composite key.
    // You typically fetch LGAs based on the stateCode when needed.
}));
exports.addressBookmarks = (0, pg_core_1.pgTable)("address_bookmarks", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    addressId: (0, pg_core_1.serial)("address_id")
        .notNull()
        .references(() => exports.addresses.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Location History Table
exports.locationHistory = (0, pg_core_1.pgTable)("location_history", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    addressId: (0, pg_core_1.serial)("address_id").references(() => exports.addresses.id, {
        onDelete: "set null",
    }),
    latitude: (0, pg_core_1.decimal)("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: (0, pg_core_1.decimal)("longitude", { precision: 11, scale: 8 }).notNull(),
    activity: (0, pg_core_1.text)("activity"), // 'search', 'navigation', 'visit'
    visitedAt: (0, pg_core_1.timestamp)("visited_at").defaultNow().notNull(),
    metadata: (0, pg_core_1.jsonb)("metadata").$type(), // Additional data like transport mode, duration, etc.
});
// User Sessions Table (for password reset, etc.)
exports.userSessions = (0, pg_core_1.pgTable)("user_sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    token: (0, pg_core_1.text)("token").notNull().unique(),
    type: (0, pg_core_1.text)("type").notNull(), // 'password_reset', 'email_verification', 'phone_verification'
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    used: (0, pg_core_1.boolean)("used").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Notifications Table
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.text)("title").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    type: (0, pg_core_1.text)("type").notNull(), // 'system', 'address_shared', 'navigation'
    read: (0, pg_core_1.boolean)("read").default(false),
    data: (0, pg_core_1.jsonb)("data").$type(), // Additional notification data
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Address Sharing Table
exports.addressShares = (0, pg_core_1.pgTable)("address_shares", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    addressId: (0, pg_core_1.serial)("address_id")
        .notNull()
        .references(() => exports.addresses.id, { onDelete: "cascade" }),
    sharedBy: (0, pg_core_1.uuid)("shared_by")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    sharedWith: (0, pg_core_1.uuid)("shared_with").references(() => exports.users.id, {
        onDelete: "cascade",
    }),
    shareCode: (0, pg_core_1.text)("share_code").unique().notNull(), // For QR codes and links
    expiresAt: (0, pg_core_1.timestamp)("expires_at"),
    viewed: (0, pg_core_1.boolean)("viewed").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Offline Maps Table
exports.offlineMaps = (0, pg_core_1.pgTable)("offline_maps", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.text)("name").notNull(),
    region: (0, pg_core_1.jsonb)("region")
        .$type()
        .notNull(),
    size: (0, pg_core_1.integer)("size"), // Size in bytes
    downloadedAt: (0, pg_core_1.timestamp)("downloaded_at").defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // When the map data expires
});
// Address Ratings Table
exports.addressRatings = (0, pg_core_1.pgTable)("address_ratings", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    addressId: (0, pg_core_1.serial)("address_id")
        .notNull()
        .references(() => exports.addresses.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    rating: (0, pg_core_1.integer)("rating").notNull(), // 1-5 stars
    review: (0, pg_core_1.text)("review"),
    helpful: (0, pg_core_1.integer)("helpful").default(0), // Number of helpful votes
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Search History Table
exports.searchHistory = (0, pg_core_1.pgTable)("search_history", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    query: (0, pg_core_1.text)("query").notNull(),
    results: (0, pg_core_1.integer)("results").default(0), // Number of results found
    selectedResult: (0, pg_core_1.serial)("selected_result").references(() => exports.addresses.id, {
        onDelete: "set null",
    }),
    searchAt: (0, pg_core_1.timestamp)("search_at").defaultNow().notNull(),
});
// Define additional relations
exports.locationHistoryRelations = (0, drizzle_orm_1.relations)(exports.locationHistory, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.locationHistory.userId],
        references: [exports.users.id],
    }),
    address: one(exports.addresses, {
        fields: [exports.locationHistory.addressId],
        references: [exports.addresses.id],
    }),
}));
exports.userSessionsRelations = (0, drizzle_orm_1.relations)(exports.userSessions, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userSessions.userId],
        references: [exports.users.id],
    }),
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.notifications.userId],
        references: [exports.users.id],
    }),
}));
exports.addressSharesRelations = (0, drizzle_orm_1.relations)(exports.addressShares, ({ one }) => ({
    address: one(exports.addresses, {
        fields: [exports.addressShares.addressId],
        references: [exports.addresses.id],
    }),
    sharedBy: one(exports.users, {
        fields: [exports.addressShares.sharedBy],
        references: [exports.users.id],
    }),
    sharedWith: one(exports.users, {
        fields: [exports.addressShares.sharedWith],
        references: [exports.users.id],
    }),
}));
exports.offlineMapsRelations = (0, drizzle_orm_1.relations)(exports.offlineMaps, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.offlineMaps.userId],
        references: [exports.users.id],
    }),
}));
exports.addressRatingsRelations = (0, drizzle_orm_1.relations)(exports.addressRatings, ({ one }) => ({
    address: one(exports.addresses, {
        fields: [exports.addressRatings.addressId],
        references: [exports.addresses.id],
    }),
    user: one(exports.users, {
        fields: [exports.addressRatings.userId],
        references: [exports.users.id],
    }),
}));
exports.searchHistoryRelations = (0, drizzle_orm_1.relations)(exports.searchHistory, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.searchHistory.userId],
        references: [exports.users.id],
    }),
    selectedResult: one(exports.addresses, {
        fields: [exports.searchHistory.selectedResult],
        references: [exports.addresses.id],
    }),
}));
// Live Location Sharing Tables
// Live Location Sessions Table
exports.liveLocationSessions = (0, pg_core_1.pgTable)("live_location_sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    sessionName: (0, pg_core_1.text)("session_name").notNull(), // User-defined name for the session
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    duration: (0, pg_core_1.integer)("duration"), // Duration in minutes (null for indefinite)
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // When the session expires
    lastLocationUpdate: (0, pg_core_1.timestamp)("last_location_update"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdx: (0, pg_core_1.index)("live_location_sessions_user_idx").on(table.userId),
        activeIdx: (0, pg_core_1.index)("live_location_sessions_active_idx").on(table.isActive),
    };
});
// Live Location Shares Table (who can see the live location)
exports.liveLocationShares = (0, pg_core_1.pgTable)("live_location_shares", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)("session_id")
        .notNull()
        .references(() => exports.liveLocationSessions.id, { onDelete: "cascade" }),
    sharedWithPersonalCode: (0, pg_core_1.text)("shared_with_personal_code").notNull(), // Personal code of the user who can see the location
    sharedWithUserId: (0, pg_core_1.uuid)("shared_with_user_id").references(() => exports.users.id, {
        onDelete: "cascade",
    }), // Resolved user ID
    canView: (0, pg_core_1.boolean)("can_view").default(true),
    lastViewedAt: (0, pg_core_1.timestamp)("last_viewed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        sessionIdx: (0, pg_core_1.index)("live_location_shares_session_idx").on(table.sessionId),
        personalCodeIdx: (0, pg_core_1.index)("live_location_shares_personal_code_idx").on(table.sharedWithPersonalCode),
        userIdx: (0, pg_core_1.index)("live_location_shares_user_idx").on(table.sharedWithUserId),
    };
});
// Live Location Updates Table (stores location updates)
exports.liveLocationUpdates = (0, pg_core_1.pgTable)("live_location_updates", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)("session_id")
        .notNull()
        .references(() => exports.liveLocationSessions.id, { onDelete: "cascade" }),
    latitude: (0, pg_core_1.decimal)("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: (0, pg_core_1.decimal)("longitude", { precision: 11, scale: 8 }).notNull(),
    accuracy: (0, pg_core_1.decimal)("accuracy", { precision: 8, scale: 2 }), // Location accuracy in meters
    speed: (0, pg_core_1.decimal)("speed", { precision: 8, scale: 2 }), // Speed in m/s
    heading: (0, pg_core_1.decimal)("heading", { precision: 5, scale: 2 }), // Bearing in degrees
    altitude: (0, pg_core_1.decimal)("altitude", { precision: 8, scale: 2 }), // Altitude in meters
    batteryLevel: (0, pg_core_1.integer)("battery_level"), // Battery percentage
    isCharging: (0, pg_core_1.boolean)("is_charging"),
    timestamp: (0, pg_core_1.timestamp)("timestamp").defaultNow().notNull(),
}, (table) => {
    return {
        sessionIdx: (0, pg_core_1.index)("live_location_updates_session_idx").on(table.sessionId),
        timestampIdx: (0, pg_core_1.index)("live_location_updates_timestamp_idx").on(table.timestamp),
    };
});
// Live Location Relations
exports.liveLocationSessionsRelations = (0, drizzle_orm_1.relations)(exports.liveLocationSessions, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.liveLocationSessions.userId],
        references: [exports.users.id],
    }),
    shares: many(exports.liveLocationShares),
    updates: many(exports.liveLocationUpdates),
}));
exports.liveLocationSharesRelations = (0, drizzle_orm_1.relations)(exports.liveLocationShares, ({ one }) => ({
    session: one(exports.liveLocationSessions, {
        fields: [exports.liveLocationShares.sessionId],
        references: [exports.liveLocationSessions.id],
    }),
    sharedWithUser: one(exports.users, {
        fields: [exports.liveLocationShares.sharedWithUserId],
        references: [exports.users.id],
    }),
}));
exports.liveLocationUpdatesRelations = (0, drizzle_orm_1.relations)(exports.liveLocationUpdates, ({ one }) => ({
    session: one(exports.liveLocationSessions, {
        fields: [exports.liveLocationUpdates.sessionId],
        references: [exports.liveLocationSessions.id],
    }),
}));
//# sourceMappingURL=schema.js.map