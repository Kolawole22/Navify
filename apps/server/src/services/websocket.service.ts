import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { db } from "../db";
import { liveLocationShares, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { parsePersonalCode } from "../utils/personalCodeGenerator";

interface AuthenticatedSocket {
  sessionId?: string;
  personalCode?: string;
  userId?: string;
  isAuthenticated: boolean;
}

interface LocationUpdate {
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  timestamp: string | Date;
}

class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  private constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(server?: HTTPServer): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Initialize socket as unauthenticated
      this.connectedClients.set(socket.id, {
        isAuthenticated: false,
      });

      // Handle authentication for location viewers
      socket.on(
        "authenticate_viewer",
        async (data: { personalCode: string; sessionId: string }) => {
          try {
            const { personalCode, sessionId } = data;

            // Validate personal code format
            const parsedCode = parsePersonalCode(personalCode);
            if (!parsedCode.isValid) {
              socket.emit("auth_error", {
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
                  eq(liveLocationShares.sharedWithPersonalCode, personalCode),
                  eq(liveLocationShares.canView, true)
                )
              )
              .limit(1);

            if (!share) {
              socket.emit("auth_error", {
                message: "Access denied to this live location session",
              });
              return;
            }

            // Resolve personal code to user ID if possible
            const [user] = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.personalCode, personalCode))
              .limit(1);

            // Update socket authentication status
            this.connectedClients.set(socket.id, {
              sessionId,
              personalCode,
              userId: user?.id,
              isAuthenticated: true,
            });

            // Join the session room
            socket.join(`session:${sessionId}`);

            socket.emit("auth_success", {
              message: "Successfully authenticated",
              sessionId,
            });

            console.log(
              `Client ${socket.id} authenticated for session ${sessionId}`
            );
          } catch (error) {
            console.error("Authentication error:", error);
            socket.emit("auth_error", { message: "Authentication failed" });
          }
        }
      );

      // Handle authentication for location sharers
      socket.on(
        "authenticate_sharer",
        async (data: { userId: string; sessionId: string }) => {
          try {
            const { userId, sessionId } = data;

            // Update socket authentication status
            this.connectedClients.set(socket.id, {
              sessionId,
              userId,
              isAuthenticated: true,
            });

            // Join the session room
            socket.join(`session:${sessionId}`);

            socket.emit("auth_success", {
              message: "Successfully authenticated as sharer",
              sessionId,
            });

            console.log(
              `Client ${socket.id} authenticated as sharer for session ${sessionId}`
            );
          } catch (error) {
            console.error("Authentication error:", error);
            socket.emit("auth_error", { message: "Authentication failed" });
          }
        }
      );

      // Handle location updates from sharers
      socket.on("location_update", async (data: LocationUpdate) => {
        try {
          const client = this.connectedClients.get(socket.id);

          if (!client?.isAuthenticated || !client.sessionId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          if (client.sessionId !== data.sessionId) {
            socket.emit("error", { message: "Session ID mismatch" });
            return;
          }

          // Broadcast location update to all viewers of this session
          this.io.to(`session:${data.sessionId}`).emit("location_update", {
            sessionId: data.sessionId,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            altitude: data.altitude,
            batteryLevel: data.batteryLevel,
            isCharging: data.isCharging,
            timestamp:
              typeof data.timestamp === "string"
                ? data.timestamp
                : data.timestamp.toISOString(),
          });

          console.log(
            `Location update broadcasted for session ${data.sessionId}`
          );
        } catch (error) {
          console.error("Location update error:", error);
          socket.emit("error", {
            message: "Failed to broadcast location update",
          });
        }
      });

      // Handle session status updates
      socket.on(
        "session_status",
        async (data: { sessionId: string; isActive: boolean }) => {
          try {
            const client = this.connectedClients.get(socket.id);

            if (!client?.isAuthenticated || !client.sessionId) {
              socket.emit("error", { message: "Not authenticated" });
              return;
            }

            // Broadcast session status to all viewers
            this.io.to(`session:${data.sessionId}`).emit("session_status", {
              sessionId: data.sessionId,
              isActive: data.isActive,
              timestamp: new Date(),
            });

            console.log(
              `Session status update broadcasted for session ${
                data.sessionId
              }: ${data.isActive ? "active" : "inactive"}`
            );
          } catch (error) {
            console.error("Session status error:", error);
            socket.emit("error", {
              message: "Failed to broadcast session status",
            });
          }
        }
      );

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Method to broadcast location update to specific session
  public broadcastLocationUpdate(
    sessionId: string,
    locationData: LocationUpdate
  ) {
    this.io.to(`session:${sessionId}`).emit("location_update", locationData);
  }

  // Method to broadcast session status change
  public broadcastSessionStatus(sessionId: string, isActive: boolean) {
    this.io.to(`session:${sessionId}`).emit("session_status", {
      sessionId,
      isActive,
      timestamp: new Date(),
    });
  }

  // Method to get connected clients count for a session
  public getSessionClientCount(sessionId: string): number {
    let count = 0;
    for (const client of this.connectedClients.values()) {
      if (client.sessionId === sessionId && client.isAuthenticated) {
        count++;
      }
    }
    return count;
  }

  // Method to get all connected clients
  public getConnectedClients(): Map<string, AuthenticatedSocket> {
    return this.connectedClients;
  }
}

export default WebSocketService;
