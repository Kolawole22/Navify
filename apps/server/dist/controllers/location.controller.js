"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLgasByState = exports.getAllStates = void 0;
const db_1 = require("../db"); // Adjust path if your db export is elsewhere
const schema_1 = require("../db/schema"); // Import schema
const drizzle_orm_1 = require("drizzle-orm");
/**
 * @desc    Get all states
 * @route   GET /api/v1/locations/states
 * @access  Public
 */
const getAllStates = async (_req, res) => {
    try {
        const allStates = await db_1.db
            .select({
            name: schema_1.states.name,
            code: schema_1.states.code,
        })
            .from(schema_1.states)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.states.name)); // Order alphabetically by name
        res.status(200).json({
            success: true,
            count: allStates.length,
            data: allStates,
        });
    }
    catch (error) {
        console.error("Error fetching states:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getAllStates = getAllStates;
/**
 * @desc    Get LGAs for a specific state
 * @route   GET /api/v1/locations/states/:stateCode/lgas
 * @access  Public
 */
const getLgasByState = async (req, res) => {
    try {
        const stateCodeParam = req.params.stateCode?.toUpperCase();
        if (!stateCodeParam || stateCodeParam.length !== 2) {
            res
                .status(400)
                .json({ success: false, message: "Invalid state code provided" });
            return;
        }
        // Optional: Check if state code actually exists first (more user-friendly error)
        // const stateExists = await db.select({ code: states.code }).from(states).where(eq(states.code, stateCodeParam)).limit(1);
        // if (stateExists.length === 0) {
        //   res.status(404).json({ success: false, message: `State with code ${stateCodeParam} not found` });
        //   return;
        // }
        const stateLgas = await db_1.db
            .select({
            name: schema_1.lgas.name,
            code: schema_1.lgas.code,
            // stateCode: lgas.stateCode // Optional: Include stateCode in response
        })
            .from(schema_1.lgas)
            .where((0, drizzle_orm_1.eq)(schema_1.lgas.stateCode, stateCodeParam))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.lgas.name)); // Order alphabetically by name
        // Send 404 if the state code was valid format but no LGAs found (might indicate bad code despite format)
        if (stateLgas.length === 0) {
            res.status(404).json({
                success: false,
                message: `No LGAs found for state code ${stateCodeParam}`,
            });
            return;
        }
        res.status(200).json({
            success: true,
            count: stateLgas.length,
            data: stateLgas,
        });
    }
    catch (error) {
        console.error(`Error fetching LGAs for state ${req.params.stateCode}:`, error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getLgasByState = getLgasByState;
//# sourceMappingURL=location.controller.js.map