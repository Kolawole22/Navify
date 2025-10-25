"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookmarkedAddresses = exports.unbookmarkAddress = exports.bookmarkAddress = exports.searchAddresses = exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.getAddress = exports.getAllSavedAddresses = void 0;
const db_1 = require("../db"); // Import Drizzle db instance
const schema_1 = require("../db/schema"); // Import Drizzle schemas
const drizzle_orm_1 = require("drizzle-orm"); // Import operators and SQL type
const zod_1 = require("zod");
const addressing_1 = require("../utils/addressing"); // Import the DDC code generator and utilities
const location_description_1 = require("../utils/location-description"); // Import location description utilities
const qrCodeService_1 = require("../services/qrCodeService"); // Import QR code service
// Validation Schema for Address Creation/Update
// Aligned with Drizzle schema and project scope
const addressInputSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    street: zod_1.z.string().optional(), // Make street optional to support addresses without street names
    city: zod_1.z.string().min(1, "City is required"),
    stateCode: zod_1.z.string().length(2).optional(), // Two-letter state code (e.g., LA for Lagos)
    lgaCode: zod_1.z.string().optional(), // LGA code within the state
    houseNumber: zod_1.z.string().optional(), // Make houseNumber optional based on schema
    estate: zod_1.z.string().optional(),
    specialDescription: zod_1.z.string().optional(),
    floor: zod_1.z.string().optional(),
    landmark: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(), // Add optional category
    // context: z.string().optional(), // Removed context if not in schema
    // userId is handled internally via auth
    isSaved: zod_1.z.boolean().optional().default(false), // Adjusted default to false
    label: zod_1.z.string().optional(), // Label primarily used when updating/saving
    photoUrls: zod_1.z.array(zod_1.z.string().url()).optional(), // Added photoUrls based on schema
});
// Schema for updating only specific fields like label or saved status
const addressUpdateSchema = zod_1.z.object({
    isSaved: zod_1.z.boolean().optional(),
    label: zod_1.z.string().optional().nullable(), // Allow clearing label
    category: zod_1.z.string().optional().nullable(), // Allow updating/clearing category
    // Potentially allow updating context/landmark later?
});
// Generate a unique Navify code (placeholder - consider a more robust method)
// function generateUniqueAddressCode(): string {
//   // Simple example, might need collision checks or a better algorithm
//   const prefix = "NAV";
//   const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Reduced ambiguous chars
//   let result = prefix;
//   for (let i = 0; i < 6; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
//   // TODO: Ensure uniqueness in the database before finalizing
// }
// --- Controller Functions ---
// Get all *saved* addresses for the authenticated user
const getAllSavedAddresses = async (req, res) => {
    try {
        // Assume userId is populated by authentication middleware
        // @ts-ignore - Assuming req.user exists after auth middleware
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userAddresses = await db_1.db
            .select()
            .from(schema_1.addresses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId), (0, drizzle_orm_1.eq)(schema_1.addresses.isSaved, true) // Only fetch explicitly saved addresses
        ))
            .orderBy(schema_1.addresses.updatedAt); // Or createdAt?
        res.json(userAddresses);
        return; // Explicitly return after sending response
    }
    catch (error) {
        console.error("Error fetching saved addresses:", error);
        res.status(500).json({ error: "Failed to fetch saved addresses" });
        return; // Explicitly return after sending response
    }
};
exports.getAllSavedAddresses = getAllSavedAddresses;
// Get a specific address by its uniqueCode or DB ID
const getAddress = async (req, // Can be uniqueCode or DB ID
res) => {
    try {
        const { identifier } = req.params;
        // @ts-ignore
        const userId = req.user?.id; // Needed for ownership check if it's a saved address
        let addressResult;
        let queryCondition;
        // Check if identifier is likely a number (DB ID) or string (uniqueCode)
        const isDbId = /^\d+$/.test(identifier);
        if (isDbId) {
            queryCondition = (0, drizzle_orm_1.eq)(schema_1.addresses.id, parseInt(identifier, 10));
        }
        else {
            queryCondition = (0, drizzle_orm_1.eq)(schema_1.addresses.hhgCode, identifier);
        }
        addressResult = await db_1.db
            .select()
            .from(schema_1.addresses)
            .where(queryCondition)
            .limit(1);
        const address = addressResult[0];
        if (!address) {
            res.status(404).json({ error: "Address not found" });
            return;
        }
        // If the address is associated with a user, check ownership
        if (address.userId) {
            if (!userId || address.userId !== userId) {
                // Allow fetching public/unowned addresses? Or always require auth?
                // For now, restrict access if it has a userId and doesn't match req.user.id
                res
                    .status(403)
                    .json({ error: "Forbidden: You do not own this address" });
                return;
            }
        }
        // If address.userId is null, assume it's a generally accessible address (e.g., generated but not saved by a specific user)
        // Modify this logic based on your application's access control requirements.
        res.json(address);
    }
    catch (error) {
        console.error("Error fetching address:", error);
        if (error instanceof Error &&
            error.message.includes("invalid input syntax for type integer")) {
            res.status(400).json({ error: "Invalid address ID format" });
            return;
        }
        res.status(500).json({ error: "Failed to fetch address" });
        return;
    }
};
exports.getAddress = getAddress;
// Create a new address entry (generates unique code)
const createAddress = async (req, res) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        const validationResult = addressInputSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: validationResult.error.format(),
            });
        }
        const inputData = validationResult.data;
        // Get the full state and LGA codes from the database
        // This ensures we have the correct format for foreign key constraints
        const locationInfo = await (0, addressing_1.findStateLga)(inputData.latitude, inputData.longitude);
        if (!locationInfo) {
            res.status(400).json({
                error: "Could not determine State/LGA for the provided coordinates. Ensure location is within Nigeria.",
            });
            return;
        }
        // Use the provided state/LGA codes if available, otherwise use the looked-up ones
        const finalStateCode = inputData.stateCode || locationInfo.stateCode;
        const finalLgaCode = inputData.lgaCode || locationInfo.lgaCode;
        // Generate the Digital Door Code (DDC) using the utility
        // Pass state and LGA codes if they're provided in the input
        const ddcResult = await (0, addressing_1.generateHhgCode)(inputData.latitude, inputData.longitude, inputData.street, inputData.landmark, inputData.houseNumber, finalStateCode, finalLgaCode);
        if (!ddcResult) {
            res.status(400).json({
                error: "Could not generate address code for the provided coordinates. Ensure location is within Nigeria.",
            });
            return;
        }
        // Extract DDC components from the result
        const { ddc, generatedHouseNumber, h3Index, h3Resolution, isCollision: _isCollision, collisionCount: _collisionCount, } = ddcResult;
        // Parse DDC components (format: NG-XX-YY-ZZZ-GGGG-NNNN)
        const ddcInfo = (0, addressing_1.parseDDC)(ddc);
        if (!ddcInfo) {
            console.error(`Failed to parse generated DDC: ${ddc}`);
            res
                .status(500)
                .json({ error: "Internal error generating address components." });
            return;
        }
        const { areaType, areaCode, locationNumber } = ddcInfo;
        // Use the full state and LGA codes for database storage
        const stateCode = finalStateCode;
        const lgaCode = finalLgaCode;
        // Prepare data for insertion using the correct schema fields
        // Handle missing or invalid street names
        let streetName = inputData.street;
        if ((0, location_description_1.needsGeneratedStreetName)(streetName)) {
            // Generate a descriptive street name based on available information
            streetName = (0, location_description_1.generateLocationDescription)({
                latitude: inputData.latitude,
                longitude: inputData.longitude,
                cityName: inputData.city,
                areaType: areaType,
                areaCode: areaCode,
                ddc: ddc,
                nearbyLandmarks: inputData.landmark ? [inputData.landmark] : undefined,
            });
        }
        // Generate QR code for the address
        let qrCodeImageUrl;
        try {
            qrCodeImageUrl = await qrCodeService_1.QRCodeService.generateAndSaveQRCode(ddc);
        }
        catch (qrError) {
            console.error("Failed to generate QR code:", qrError);
            // Continue without QR code - it's not critical for address creation
        }
        const newAddressData = {
            // Fields from input
            latitude: inputData.latitude.toString(),
            longitude: inputData.longitude.toString(),
            street: streetName,
            city: inputData.city,
            houseNumber: inputData.houseNumber, // User-provided house number
            generatedHouseNumber: generatedHouseNumber, // Grid-based generated house number
            h3Index: h3Index, // H3 cell identifier
            h3Resolution: h3Resolution, // Grid resolution used
            estate: inputData.estate,
            floor: inputData.floor,
            specialDescription: inputData.specialDescription,
            landmark: inputData.landmark,
            photoUrls: inputData.photoUrls,
            userId: userId,
            isSaved: inputData.isSaved,
            label: inputData.label,
            category: inputData.category,
            // Derived/Generated fields
            hhgCode: ddc, // Store the full DDC as the hhgCode
            stateCode: stateCode,
            lgaCode: lgaCode,
            areaType: areaType,
            areaCode: areaCode,
            locationNumber: locationNumber,
            qrCodeImageUrl: qrCodeImageUrl, // Store the QR code URL
        };
        const insertedResult = await db_1.db
            .insert(schema_1.addresses)
            .values(newAddressData)
            .returning();
        const newAddress = insertedResult[0];
        res.status(201).json(newAddress);
        return;
    }
    catch (error) {
        console.error("Error creating address:", error);
        // Handle potential unique constraint violation on hhgCode (less likely but possible)
        res.status(500).json({ error: "Failed to create address" });
        return;
    }
};
exports.createAddress = createAddress;
// Update an existing address (e.g., save/unsave, add/change label)
const updateAddress = async (req, // Use DB ID for updates
res) => {
    try {
        const addressId = parseInt(req.params.id, 10);
        if (isNaN(addressId)) {
            res.status(400).json({ error: "Invalid address ID format" });
            return;
        }
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const validationResult = addressUpdateSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                error: "Validation failed",
                details: validationResult.error.format(),
            });
            return;
        }
        const { isSaved, label, category } = validationResult.data;
        // Construct update data - only include fields that are provided
        const updateData = {};
        if (isSaved !== undefined)
            updateData.isSaved = isSaved;
        // Allow setting label to null to clear it
        if (label !== undefined)
            updateData.label = label;
        if (category !== undefined)
            updateData.category = category;
        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ error: "No fields provided for update." });
            return;
        }
        updateData.updatedAt = new Date(); // Manually update timestamp
        const updatedResult = await db_1.db
            .update(schema_1.addresses)
            .set(updateData)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, addressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId) // Ensure user owns the address
        ))
            .returning();
        const updatedAddress = updatedResult[0];
        if (!updatedAddress) {
            // Could be not found OR forbidden, check if address exists without userId condition?
            // For simplicity, return 404, but could check existence first for a 403.
            res.status(404).json({
                error: "Address not found or you do not have permission to update it",
            });
            return;
        }
        res.json(updatedAddress);
    }
    catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ error: "Failed to update address" });
    }
};
exports.updateAddress = updateAddress;
// Delete a saved address (logically or physically)
const deleteAddress = async (req, // Use DB ID for deletion
res) => {
    try {
        const addressId = parseInt(req.params.id, 10);
        if (isNaN(addressId)) {
            res.status(400).json({ error: "Invalid address ID format" });
            return;
        }
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // First, get the address to check if it has a QR code to clean up
        const addressToDelete = await db_1.db
            .select({ qrCodeImageUrl: schema_1.addresses.qrCodeImageUrl })
            .from(schema_1.addresses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, addressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId) // Ensure user owns the address
        ))
            .limit(1);
        if (addressToDelete.length === 0) {
            res.status(404).json({
                error: "Address not found or you do not have permission to delete it",
            });
            return;
        }
        // Delete the address
        const deleteResult = await db_1.db
            .delete(schema_1.addresses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, addressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId) // Ensure user owns the address
        ))
            .returning({ id: schema_1.addresses.id });
        // Clean up the QR code file if it exists
        if (addressToDelete[0].qrCodeImageUrl) {
            try {
                qrCodeService_1.QRCodeService.deleteQRCode(addressToDelete[0].qrCodeImageUrl);
            }
            catch (qrError) {
                console.error("Failed to delete QR code file:", qrError);
                // Continue - file cleanup failure shouldn't prevent address deletion
            }
        }
        // If nothing was deleted, it means either the address didn't exist
        // or it didn't belong to the user. Return 204 regardless for idempotency.
        if (deleteResult.length === 0) {
            // Optional: Log this case? "Attempted to delete non-existent or unauthorized address"
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Failed to delete address" });
    }
};
exports.deleteAddress = deleteAddress;
// Search for addresses based on a query string
const searchAddresses = async (req, res) => {
    const query = req.query.q;
    if (!query || typeof query !== "string" || query.trim().length < 1) {
        res
            .status(400)
            .json({ error: "Search query 'q' is required and must be a string." });
        return;
    }
    const searchTerm = `%${query.trim()}%`; // Prepare for LIKE/ILIKE
    const limit = 5; // Limit results
    try {
        // @ts-ignore - Assuming req.user might exist for personalized search later
        const userId = req.user?.id;
        if (userId) {
            // If user is authenticated, include bookmark information
            const searchResults = await db_1.db
                .select({
                id: schema_1.addresses.id,
                hhgCode: schema_1.addresses.hhgCode,
                street: schema_1.addresses.street,
                city: schema_1.addresses.city,
                stateCode: schema_1.addresses.stateCode,
                lgaCode: schema_1.addresses.lgaCode,
                latitude: schema_1.addresses.latitude,
                longitude: schema_1.addresses.longitude,
                houseNumber: schema_1.addresses.houseNumber,
                estate: schema_1.addresses.estate,
                floor: schema_1.addresses.floor,
                landmark: schema_1.addresses.landmark,
                specialDescription: schema_1.addresses.specialDescription,
                category: schema_1.addresses.category,
                photoUrls: schema_1.addresses.photoUrls,
                isSaved: schema_1.addresses.isSaved,
                label: schema_1.addresses.label,
                userId: schema_1.addresses.userId,
                createdAt: schema_1.addresses.createdAt,
                updatedAt: schema_1.addresses.updatedAt,
                areaType: schema_1.addresses.areaType,
                areaCode: schema_1.addresses.areaCode,
                locationNumber: schema_1.addresses.locationNumber,
                bookmarkId: schema_1.addressBookmarks.id, // Will be null if not bookmarked
            })
                .from(schema_1.addresses)
                .leftJoin(schema_1.addressBookmarks, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addressBookmarks.addressId, schema_1.addresses.id), (0, drizzle_orm_1.eq)(schema_1.addressBookmarks.userId, userId)))
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.addresses.street, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.city, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.landmark, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.estate, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.specialDescription, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.hhgCode, searchTerm)))
                .limit(limit)
                .orderBy(schema_1.addresses.city, schema_1.addresses.street);
            // Process results to add isBookmarked field
            const processedResults = searchResults.map((result) => ({
                ...result,
                isBookmarked: !!result.bookmarkId,
                bookmarkId: undefined, // Remove the bookmarkId from final result
            }));
            res.json(processedResults);
        }
        else {
            // If no user, just return addresses without bookmark info
            const searchResults = await db_1.db
                .select({
                id: schema_1.addresses.id,
                hhgCode: schema_1.addresses.hhgCode,
                street: schema_1.addresses.street,
                city: schema_1.addresses.city,
                stateCode: schema_1.addresses.stateCode,
                lgaCode: schema_1.addresses.lgaCode,
                latitude: schema_1.addresses.latitude,
                longitude: schema_1.addresses.longitude,
                houseNumber: schema_1.addresses.houseNumber,
                estate: schema_1.addresses.estate,
                floor: schema_1.addresses.floor,
                landmark: schema_1.addresses.landmark,
                specialDescription: schema_1.addresses.specialDescription,
                category: schema_1.addresses.category,
                photoUrls: schema_1.addresses.photoUrls,
                isSaved: schema_1.addresses.isSaved,
                label: schema_1.addresses.label,
                userId: schema_1.addresses.userId,
                createdAt: schema_1.addresses.createdAt,
                updatedAt: schema_1.addresses.updatedAt,
                areaType: schema_1.addresses.areaType,
                areaCode: schema_1.addresses.areaCode,
                locationNumber: schema_1.addresses.locationNumber,
            })
                .from(schema_1.addresses)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.addresses.street, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.city, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.landmark, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.estate, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.specialDescription, searchTerm), (0, drizzle_orm_1.ilike)(schema_1.addresses.hhgCode, searchTerm)))
                .limit(limit)
                .orderBy(schema_1.addresses.city, schema_1.addresses.street);
            // Add isBookmarked as false for unauthenticated users
            const processedResults = searchResults.map((result) => ({
                ...result,
                isBookmarked: false,
            }));
            res.json(processedResults);
        }
    }
    catch (error) {
        console.error("Error searching addresses:", error);
        res.status(500).json({ error: "Failed to search addresses" });
    }
};
exports.searchAddresses = searchAddresses;
// --- Address Bookmarks ---
const bookmarkAddress = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const addressId = Number(req.params.id);
    if (!addressId) {
        res.status(400).json({ error: "Invalid address id" });
        return;
    }
    try {
        // Check if already bookmarked
        const existing = await db_1.db
            .select()
            .from(schema_1.addressBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addressBookmarks.userId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.addressBookmarks.addressId, addressId)));
        if (existing.length > 0) {
            res.status(409).json({ error: "Address already bookmarked" });
            return;
        }
        await db_1.db
            .insert(schema_1.addressBookmarks)
            .values({ userId: req.user.id, addressId });
        res.status(201).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to bookmark address" });
    }
};
exports.bookmarkAddress = bookmarkAddress;
const unbookmarkAddress = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const addressId = Number(req.params.id);
    if (!addressId) {
        res.status(400).json({ error: "Invalid address id" });
        return;
    }
    try {
        await db_1.db
            .delete(schema_1.addressBookmarks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addressBookmarks.userId, req.user.id), (0, drizzle_orm_1.eq)(schema_1.addressBookmarks.addressId, addressId)));
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: "Failed to remove bookmark" });
    }
};
exports.unbookmarkAddress = unbookmarkAddress;
const getBookmarkedAddresses = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        // Join bookmarks and addresses
        const bookmarks = await db_1.db
            .select({
            id: schema_1.addresses.id,
            hhgCode: schema_1.addresses.hhgCode,
            street: schema_1.addresses.street,
            city: schema_1.addresses.city,
            stateCode: schema_1.addresses.stateCode,
            lgaCode: schema_1.addresses.lgaCode,
            latitude: schema_1.addresses.latitude,
            longitude: schema_1.addresses.longitude,
            label: schema_1.addresses.label,
            createdAt: schema_1.addresses.createdAt,
        })
            .from(schema_1.addressBookmarks)
            .innerJoin(schema_1.addresses, (0, drizzle_orm_1.eq)(schema_1.addressBookmarks.addressId, schema_1.addresses.id))
            .where((0, drizzle_orm_1.eq)(schema_1.addressBookmarks.userId, req.user.id));
        res.json({ bookmarks });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
};
exports.getBookmarkedAddresses = getBookmarkedAddresses;
//# sourceMappingURL=address.controller.js.map