import { Request, Response } from "express";
import { db } from "../db"; // Adjust path if your db export is elsewhere
import { states, lgas } from "../db/schema"; // Import schema
import { eq, asc } from "drizzle-orm";

/**
 * @desc    Get all states
 * @route   GET /api/v1/locations/states
 * @access  Public
 */
export const getAllStates = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const allStates = await db
      .select({
        name: states.name,
        code: states.code,
      })
      .from(states)
      .orderBy(asc(states.name)); // Order alphabetically by name

    res.status(200).json({
      success: true,
      count: allStates.length,
      data: allStates,
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Get LGAs for a specific state
 * @route   GET /api/v1/locations/states/:stateCode/lgas
 * @access  Public
 */
export const getLgasByState = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const stateLgas = await db
      .select({
        name: lgas.name,
        code: lgas.code,
        // stateCode: lgas.stateCode // Optional: Include stateCode in response
      })
      .from(lgas)
      .where(eq(lgas.stateCode, stateCodeParam))
      .orderBy(asc(lgas.name)); // Order alphabetically by name

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
  } catch (error) {
    console.error(
      `Error fetching LGAs for state ${req.params.stateCode}:`,
      error
    );
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
