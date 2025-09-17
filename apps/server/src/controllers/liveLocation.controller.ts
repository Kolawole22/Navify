import { Request, Response } from "express";
import { db } from "../db";
import {
  liveLocationSessions,
  liveLocationShares,
  liveLocationUpdates,
  users,
} from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { parsePersonalCode } from "../utils/personalCodeGenerator";
import WebSocketService from "../services/websocket.service";

// Get WebSocket service instance
const getWebSocketService = () => WebSocketService.getInstance();

// Types
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

// Type guard to check if request is authenticated
const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return req.user !== undefined;
};

interface LocationUpdateData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

interface CreateSessionData {
  sessionName: string;
  duration?: number; // in minutes
  sharedWithPersonalCodes: string[];
}

/**
 * Create a new live location sharing session
 */
export async function createLiveLocationSession(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const {
      sessionName,
      duration,
      sharedWithPersonalCodes,
    }: CreateSessionData = req.body;

    if (!sessionName || !Array.isArray(sharedWithPersonalCodes)) {
      res.status(400).json({
        success: false,
        message: "Session name and shared with personal codes are required",
      });
      return;
    }

    // Validate personal codes
    const invalidCodes = sharedWithPersonalCodes.filter(
      (code) => !parsePersonalCode(code).isValid
    );
    if (invalidCodes.length > 0) {
      res.status(400).json({
        success: false,
        message: "Invalid personal codes provided",
        invalidCodes,
      });
      return;
    }

    // Calculate expiration time if duration is provided
    const expiresAt = duration
      ? new Date(Date.now() + duration * 60 * 1000)
      : null;

    // Create the session
    const [newSession] = await db
      .insert(liveLocationSessions)
      .values({
        userId: req.user.id,
        sessionName,
        duration,
        expiresAt,
        isActive: true,
      })
      .returning();

    // Create shares for each personal code
    const sharePromises = sharedWithPersonalCodes.map(async (personalCode) => {
      // Try to resolve the personal code to a user ID
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.personalCode, personalCode))
        .limit(1);

      return db.insert(liveLocationShares).values({
        sessionId: newSession.id,
        sharedWithPersonalCode: personalCode,
        sharedWithUserId: user?.id || null,
        canView: true,
      });
      return;
    });

    await Promise.all(sharePromises);

    res.status(201).json({
      success: true,
      message: "Live location session created successfully",
      data: {
        id: newSession.id,
        sessionName: newSession.sessionName,
        isActive: newSession.isActive,
        duration: newSession.duration,
        expiresAt: newSession.expiresAt,
        lastLocationUpdate: newSession.lastLocationUpdate,
        createdAt: newSession.createdAt,
        shareCount: sharedWithPersonalCodes.length,
      },
    });
    return;
  } catch (error) {
    console.error("Error creating live location session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create live location session",
    });
  }
}

/**
 * Update location for an active session
 */
export async function updateLocation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
      return;
    }
    const locationData: LocationUpdateData = req.body;

    if (!sessionId || !locationData.latitude || !locationData.longitude) {
      res.status(400).json({
        success: false,
        message: "Session ID, latitude, and longitude are required",
      });
      return;
    }

    // Verify the session belongs to the user and is active
    const [session] = await db
      .select()
      .from(liveLocationSessions)
      .where(
        and(
          eq(liveLocationSessions.id, sessionId),
          eq(liveLocationSessions.userId, req.user.id),
          eq(liveLocationSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Active session not found",
      });
      return;
    }

    // Check if session has expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      // Deactivate the session
      await db
        .update(liveLocationSessions)
        .set({ isActive: false })
        .where(eq(liveLocationSessions.id, sessionId));

      res.status(410).json({
        success: false,
        message: "Session has expired",
      });
      return;
    }

    // Insert location update
    const [locationUpdate] = await db
      .insert(liveLocationUpdates)
      .values({
        sessionId,
        latitude: locationData.latitude.toString(),
        longitude: locationData.longitude.toString(),
        accuracy: locationData.accuracy?.toString(),
        speed: locationData.speed?.toString(),
        heading: locationData.heading?.toString(),
        altitude: locationData.altitude?.toString(),
        batteryLevel: locationData.batteryLevel,
        isCharging: locationData.isCharging,
      })
      .returning();

    // Update session's last location update time
    await db
      .update(liveLocationSessions)
      .set({ lastLocationUpdate: new Date() })
      .where(eq(liveLocationSessions.id, sessionId));

    // Broadcast location update via WebSocket
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.broadcastLocationUpdate(sessionId, {
        sessionId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        altitude: locationData.altitude,
        batteryLevel: locationData.batteryLevel,
        isCharging: locationData.isCharging,
        timestamp: locationUpdate.timestamp,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        updateId: locationUpdate.id,
        timestamp: locationUpdate.timestamp,
      },
    });
    return;
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
    });
  }
}

/**
 * Get live location for a specific session (for viewers)
 */
export async function getLiveLocation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
      return;
    }
    const { personalCode } = req.query;

    if (!personalCode || typeof personalCode !== "string") {
      res.status(400).json({
        success: false,
        message: "Personal code is required",
      });
      return;
    }

    const personalCodeString = personalCode as string;

    // Validate personal code format
    const parsedCode = parsePersonalCode(personalCodeString);
    if (!parsedCode.isValid) {
      res.status(400).json({
        success: false,
        message: "Invalid personal code format",
      });
      return;
    }

    // Check if the personal code has access to this session
    const [share] = await db
      .select()
      .from(liveLocationShares)
      .where(
        and(
          eq(liveLocationShares.sessionId, sessionId),
          eq(liveLocationShares.sharedWithPersonalCode, personalCodeString),
          eq(liveLocationShares.canView, true)
        )
      )
      .limit(1);

    if (!share) {
      res.status(403).json({
        success: false,
        message: "Access denied to this live location session",
      });
      return;
    }

    // Get the session details
    const [session] = await db
      .select({
        id: liveLocationSessions.id,
        sessionName: liveLocationSessions.sessionName,
        isActive: liveLocationSessions.isActive,
        lastLocationUpdate: liveLocationSessions.lastLocationUpdate,
        expiresAt: liveLocationSessions.expiresAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(liveLocationSessions)
      .leftJoin(users, eq(liveLocationSessions.userId, users.id))
      .where(eq(liveLocationSessions.id, sessionId))
      .limit(1);

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    if (!session.isActive) {
      res.status(410).json({
        success: false,
        message: "Session is no longer active",
      });
      return;
    }

    // Get the latest location update
    const [latestLocation] = await db
      .select()
      .from(liveLocationUpdates)
      .where(eq(liveLocationUpdates.sessionId, sessionId))
      .orderBy(desc(liveLocationUpdates.timestamp))
      .limit(1);

    // Update last viewed timestamp
    await db
      .update(liveLocationShares)
      .set({ lastViewedAt: new Date() })
      .where(eq(liveLocationShares.id, share.id));

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          sessionName: session.sessionName,
          isActive: session.isActive,
          lastLocationUpdate: session.lastLocationUpdate,
          expiresAt: session.expiresAt,
          sharedBy: `${session.userFirstName} ${session.userLastName}`,
        },
        location: latestLocation
          ? {
              latitude: parseFloat(latestLocation.latitude),
              longitude: parseFloat(latestLocation.longitude),
              accuracy: latestLocation.accuracy
                ? parseFloat(latestLocation.accuracy)
                : null,
              speed: latestLocation.speed
                ? parseFloat(latestLocation.speed)
                : null,
              heading: latestLocation.heading
                ? parseFloat(latestLocation.heading)
                : null,
              altitude: latestLocation.altitude
                ? parseFloat(latestLocation.altitude)
                : null,
              batteryLevel: latestLocation.batteryLevel,
              isCharging: latestLocation.isCharging,
              timestamp: latestLocation.timestamp,
            }
          : null,
      },
    });
    return;
  } catch (error) {
    console.error("Error getting live location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get live location",
    });
  }
}

/**
 * Get user's active live location sessions
 */
export async function getUserSessions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    const sessions = await db
      .select({
        id: liveLocationSessions.id,
        sessionName: liveLocationSessions.sessionName,
        isActive: liveLocationSessions.isActive,
        duration: liveLocationSessions.duration,
        expiresAt: liveLocationSessions.expiresAt,
        lastLocationUpdate: liveLocationSessions.lastLocationUpdate,
        createdAt: liveLocationSessions.createdAt,
        shareCount: sql<number>`count(${liveLocationShares.id})`,
      })
      .from(liveLocationSessions)
      .leftJoin(
        liveLocationShares,
        eq(liveLocationSessions.id, liveLocationShares.sessionId)
      )
      .where(eq(liveLocationSessions.userId, req.user.id))
      .groupBy(liveLocationSessions.id)
      .orderBy(desc(liveLocationSessions.createdAt));

    res.status(200).json({
      success: true,
      data: sessions,
    });
    return;
  } catch (error) {
    console.error("Error getting user sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user sessions",
    });
  }
}

/**
 * Stop a live location session
 */
export async function stopLiveLocationSession(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
      return;
    }

    // Verify the session belongs to the user
    const [session] = await db
      .select()
      .from(liveLocationSessions)
      .where(
        and(
          eq(liveLocationSessions.id, sessionId),
          eq(liveLocationSessions.userId, req.user.id)
        )
      )
      .limit(1);

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Deactivate the session
    await db
      .update(liveLocationSessions)
      .set({ isActive: false })
      .where(eq(liveLocationSessions.id, sessionId));

    // Broadcast session status change via WebSocket
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.broadcastSessionStatus(sessionId, false);
    }

    res.status(200).json({
      success: true,
      message: "Live location session stopped successfully",
    });
    return;
  } catch (error) {
    console.error("Error stopping live location session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to stop live location session",
    });
  }
}

/**
 * Add more people to an existing session
 */
export async function addToSession(req: Request, res: Response): Promise<void> {
  try {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
      return;
    }
    const { personalCodes }: { personalCodes: string[] } = req.body;

    if (!Array.isArray(personalCodes) || personalCodes.length === 0) {
      res.status(400).json({
        success: false,
        message: "Personal codes array is required",
      });
      return;
    }

    // Validate personal codes
    const invalidCodes = personalCodes.filter(
      (code) => !parsePersonalCode(code).isValid
    );
    if (invalidCodes.length > 0) {
      res.status(400).json({
        success: false,
        message: "Invalid personal codes provided",
        invalidCodes,
      });
      return;
    }

    // Verify the session belongs to the user and is active
    const [session] = await db
      .select()
      .from(liveLocationSessions)
      .where(
        and(
          eq(liveLocationSessions.id, sessionId),
          eq(liveLocationSessions.userId, req.user.id),
          eq(liveLocationSessions.isActive, true)
        )
      )
      .limit(1);

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Active session not found",
      });
      return;
    }

    // Add new shares
    const sharePromises = personalCodes.map(async (personalCode) => {
      // Check if already shared
      const [existingShare] = await db
        .select()
        .from(liveLocationShares)
        .where(
          and(
            eq(liveLocationShares.sessionId, sessionId),
            eq(liveLocationShares.sharedWithPersonalCode, personalCode)
          )
        )
        .limit(1);

      if (existingShare) {
        return null; // Already shared
      }

      // Try to resolve the personal code to a user ID
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.personalCode, personalCode))
        .limit(1);

      return db.insert(liveLocationShares).values({
        sessionId,
        sharedWithPersonalCode: personalCode,
        sharedWithUserId: user?.id || null,
        canView: true,
      });
      return;
    });

    const results = await Promise.all(sharePromises);
    const addedCount = results.filter((result) => result !== null).length;

    res.status(200).json({
      success: true,
      message: `Added ${addedCount} new people to the session`,
      data: {
        addedCount,
        totalPersonalCodes: personalCodes.length,
      },
    });
    return;
  } catch (error) {
    console.error("Error adding to session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add people to session",
    });
  }
}

/**
 * Remove someone from a session
 */
export async function removeFromSession(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!isAuthenticatedRequest(req)) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }
    const { sessionId, personalCode } = req.params;
    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      !personalCode ||
      typeof personalCode !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid session ID or personal code",
      });
      return;
    }

    if (!personalCode) {
      res.status(400).json({
        success: false,
        message: "Personal code is required",
      });
      return;
    }

    // Verify the session belongs to the user
    const [session] = await db
      .select()
      .from(liveLocationSessions)
      .where(
        and(
          eq(liveLocationSessions.id, sessionId),
          eq(liveLocationSessions.userId, req.user.id)
        )
      )
      .limit(1);

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Remove the share
    const result = await db
      .delete(liveLocationShares)
      .where(
        and(
          eq(liveLocationShares.sessionId, sessionId),
          eq(liveLocationShares.sharedWithPersonalCode, personalCode)
        )
      );

    res.status(200).json({
      success: true,
      message: "Person removed from session successfully",
      data: {
        removedCount: result,
      },
    });
    return;
  } catch (error) {
    console.error("Error removing from session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove person from session",
    });
  }
}
