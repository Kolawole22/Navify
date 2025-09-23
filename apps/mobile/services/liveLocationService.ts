import * as Location from "expo-location";
import { io, Socket } from "socket.io-client";
import axiosInstance, { BASE_URL } from "../lib/axiosInstance";
import { useAuthStore } from "../store/authStore";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface LiveLocationSession {
  id: string;
  sessionName: string;
  isActive: boolean;
  duration?: number;
  expiresAt?: string;
  lastLocationUpdate?: string;
  createdAt: string;
  shareCount: number;
}

export interface LiveLocationData {
  session: {
    id: string;
    sessionName: string;
    isActive: boolean;
    lastLocationUpdate?: string;
    expiresAt?: string;
    sharedBy: string;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    batteryLevel?: number;
    isCharging?: boolean;
    timestamp: string;
  } | null;
}

export interface CreateSessionData {
  sessionName: string;
  duration?: number;
  sharedWithPersonalCodes: string[];
}

class LiveLocationService {
  private socket: Socket | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private batteryLevelSubscription: { remove: () => void } | null = null;
  private batteryStateSubscription: { remove: () => void } | null = null;
  private currentSessionId: string | null = null;
  private isTracking = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private currentBatteryLevel: number | undefined = undefined;
  private currentIsCharging: boolean | undefined = undefined;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    this.socket = io(BASE_URL, {
      transports: ["websocket"],
      autoConnect: false,
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    this.socket.on("auth_success", (data) => {
      console.log("WebSocket authentication successful:", data);
    });

    this.socket.on("auth_error", (error) => {
      console.error("WebSocket authentication error:", error);
    });

    this.socket.on("location_update", (data) => {
      console.log("Received location update:", data);
      // This will be handled by the component that's listening
    });

    this.socket.on("session_status", (data) => {
      console.log("Session status update:", data);
      // This will be handled by the component that's listening
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  // Create a new live location session
  async createSession(data: CreateSessionData): Promise<LiveLocationSession> {
    try {
      const response = await axiosInstance.post(
        "/live-location/sessions",
        data
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating live location session:", error);
      throw error;
    }
  }

  // Get user's live location sessions
  async getUserSessions(): Promise<LiveLocationSession[]> {
    try {
      const response = await axiosInstance.get("/live-location/sessions");
      return response.data.data;
    } catch (error) {
      console.error("Error getting user sessions:", error);
      throw error;
    }
  }

  // Start location tracking for a session
  async startLocationTracking(sessionId: string): Promise<void> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission not granted");
      }

      // Request background location permissions
      const backgroundStatus =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== "granted") {
        console.warn("Background location permission not granted");
      }

      this.currentSessionId = sessionId;
      this.isTracking = true;

      // Initialize battery monitoring
      await this.initializeBatteryMonitoring();

      // Connect to WebSocket and authenticate as sharer
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }

      // Wait for connection
      await new Promise((resolve) => {
        if (this.socket?.connected) {
          resolve(true);
        } else {
          this.socket?.on("connect", () => resolve(true));
        }
      });

      // Authenticate as sharer
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      this.socket?.emit("authenticate_sharer", {
        userId,
        sessionId,
      });

      // Start location updates
      this.startLocationUpdates(sessionId);

      console.log("Location tracking started for session:", sessionId);
    } catch (error) {
      console.error("Error starting location tracking:", error);
      throw error;
    }
  }

  // Stop location tracking
  async stopLocationTracking(): Promise<void> {
    try {
      this.isTracking = false;
      this.currentSessionId = null;

      // Stop location subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Stop battery monitoring
      this.stopBatteryMonitoring();

      // Clear update interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Disconnect from WebSocket
      if (this.socket && this.socket.connected) {
        this.socket.disconnect();
      }

      console.log("Location tracking stopped");
    } catch (error) {
      console.error("Error stopping location tracking:", error);
      throw error;
    }
  }

  // Start location updates
  private startLocationUpdates(sessionId: string) {
    // Get initial location
    this.getCurrentLocation(sessionId);

    // Set up interval for regular updates (every 10 seconds)
    this.updateInterval = setInterval(() => {
      if (this.isTracking && this.currentSessionId === sessionId) {
        this.getCurrentLocation(sessionId);
      }
    }, 10000);

    // Set up high accuracy location subscription
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        if (this.isTracking && this.currentSessionId === sessionId) {
          this.sendLocationUpdate(sessionId, location);
        }
      }
    ).then((subscription) => {
      this.locationSubscription = subscription;
    });
  }

  // Get current location and send update
  private async getCurrentLocation(sessionId: string) {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await this.sendLocationUpdate(sessionId, location);
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  }

  // Initialize battery monitoring
  private async initializeBatteryMonitoring() {
    // Feature toggle: flip to true when your dev build includes expo-battery
    const BATTERY_ENABLED = false;
    if (!BATTERY_ENABLED) {
      // Dummy defaults for dev build without battery module
      this.currentBatteryLevel = 75;
      this.currentIsCharging = false;
      return;
    }

    try {
      const Battery = await import("expo-battery");

      // Get initial battery state
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();

      this.currentBatteryLevel = Math.round(batteryLevel * 100);
      this.currentIsCharging = batteryState === Battery.BatteryState.CHARGING;

      // Set up battery level monitoring
      this.batteryLevelSubscription = Battery.addBatteryLevelListener(
        ({ batteryLevel }) => {
          this.currentBatteryLevel = Math.round(batteryLevel * 100);
        }
      );

      // Set up battery state monitoring
      this.batteryStateSubscription = Battery.addBatteryStateListener(
        ({ batteryState }) => {
          this.currentIsCharging =
            batteryState === Battery.BatteryState.CHARGING;
        }
      );
    } catch (error) {
      console.error("Error initializing battery monitoring:", error);
    }
  }

  // Stop battery monitoring
  private stopBatteryMonitoring() {
    if (this.batteryLevelSubscription) {
      this.batteryLevelSubscription.remove();
      this.batteryLevelSubscription = null;
    }

    if (this.batteryStateSubscription) {
      this.batteryStateSubscription.remove();
      this.batteryStateSubscription = null;
    }

    this.currentBatteryLevel = undefined;
    this.currentIsCharging = undefined;

    console.log("Battery monitoring stopped");
  }

  // Get current battery information
  private getCurrentBatteryInfo() {
    return {
      batteryLevel: this.currentBatteryLevel,
      isCharging: this.currentIsCharging,
    };
  }

  // Get battery information (fallback method)
  private async getBatteryInfo() {
    // Feature toggle kept in sync with initializeBatteryMonitoring
    const BATTERY_ENABLED = false;
    if (!BATTERY_ENABLED) {
      return { batteryLevel: 75, isCharging: false };
    }

    try {
      const Battery = await import("expo-battery");
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      return {
        batteryLevel: Math.round(batteryLevel * 100),
        isCharging: batteryState === Battery.BatteryState.CHARGING,
      };
    } catch (error) {
      console.error("Error getting battery info:", error);
      return { batteryLevel: undefined, isCharging: undefined };
    }
  }

  // Send location update to server
  private async sendLocationUpdate(
    sessionId: string,
    location: Location.LocationObject
  ) {
    try {
      // Get current battery information (from monitoring or fallback)
      const batteryInfo =
        this.currentBatteryLevel !== undefined
          ? this.getCurrentBatteryInfo()
          : await this.getBatteryInfo();

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        altitude: location.coords.altitude || undefined,
        batteryLevel: batteryInfo.batteryLevel,
        isCharging: batteryInfo.isCharging,
      };

      // Send via HTTP API
      await axiosInstance.post(
        `/live-location/sessions/${sessionId}/location`,
        locationData
      );

      // Also send via WebSocket for real-time updates
      this.socket?.emit("location_update", {
        sessionId,
        ...locationData,
        timestamp: new Date().toISOString(), // Convert to ISO string
      });

      console.log("Location update sent:", locationData);
    } catch (error) {
      console.error("Error sending location update:", error);
    }
  }

  // Stop a live location session
  async stopSession(sessionId: string): Promise<void> {
    try {
      await axiosInstance.put(`/live-location/sessions/${sessionId}/stop`);

      // Broadcast session status change via WebSocket
      this.socket?.emit("session_status", {
        sessionId,
        isActive: false,
      });

      console.log("Session stopped:", sessionId);
    } catch (error) {
      console.error("Error stopping session:", error);
      throw error;
    }
  }

  // Add people to a session
  async addToSession(
    sessionId: string,
    personalCodes: string[]
  ): Promise<void> {
    try {
      await axiosInstance.post(`/live-location/sessions/${sessionId}/add`, {
        personalCodes,
      });
      console.log("Added people to session:", personalCodes);
    } catch (error) {
      console.error("Error adding to session:", error);
      throw error;
    }
  }

  // Remove someone from a session
  async removeFromSession(
    sessionId: string,
    personalCode: string
  ): Promise<void> {
    try {
      await axiosInstance.delete(
        `/live-location/sessions/${sessionId}/remove/${personalCode}`
      );
      console.log("Removed person from session:", personalCode);
    } catch (error) {
      console.error("Error removing from session:", error);
      throw error;
    }
  }

  // Get live location for viewing (requires personal code)
  async getLiveLocation(
    sessionId: string,
    personalCode: string
  ): Promise<LiveLocationData> {
    try {
      const response = await axiosInstance.get(
        `/live-location/sessions/${sessionId}/live?personalCode=${personalCode}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error getting live location:", error);
      throw error;
    }
  }

  // Connect as viewer to receive live location updates
  async connectAsViewer(
    sessionId: string,
    personalCode: string
  ): Promise<void> {
    try {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }

      // Wait for connection with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000); // 10 second timeout

        if (this.socket?.connected) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          this.socket?.on("connect", () => {
            clearTimeout(timeout);
            resolve(true);
          });

          this.socket?.on("connect_error", (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        }
      });

      // Authenticate as viewer
      this.socket?.emit("authenticate_viewer", {
        personalCode,
        sessionId,
      });

      console.log("Connected as viewer for session:", sessionId);
    } catch (error) {
      console.error("Error connecting as viewer:", error);
      throw error;
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Get socket instance for event listeners
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

// Export singleton instance
export const liveLocationService = new LiveLocationService();
export default liveLocationService;
