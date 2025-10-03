import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { useLiveLocationWebSocket } from "../hooks/useLiveLocation";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  timestamp: string;
}

interface LiveLocationMapProps {
  sessionId: string;
  personalCode: string;
  sessionInfo?: {
    name: string;
    isActive: boolean;
    sharedBy: string;
  };
  onLocationUpdate?: (location: LocationData) => void;
  onSessionStatusChange?: (isActive: boolean) => void;
}

const { width, height } = Dimensions.get("window");

export default function LiveLocationMap({
  sessionId,
  personalCode,
  sessionInfo,
  onLocationUpdate,
  onSessionStatusChange,
}: LiveLocationMapProps) {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [followUser, setFollowUser] = useState(true);

  const { socket, isConnected } = useLiveLocationWebSocket(
    sessionId,
    personalCode,
    (data) => {
      console.log("Real-time location update received:", data);
      const locationData: LocationData = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        altitude: data.altitude,
        batteryLevel: data.batteryLevel,
        isCharging: data.isCharging,
        timestamp: data.timestamp,
      };

      setCurrentLocation(locationData);
      onLocationUpdate?.(locationData);

      // Follow user if enabled
      if (followUser && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    },
    (data) => {
      console.log("Session status update received:", data);
      onSessionStatusChange?.(data.isActive);
    }
  );

  // Center map on initial location
  useEffect(() => {
    if (currentLocation && mapRef.current && followUser) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation, followUser]);

  const toggleFollowUser = () => {
    setFollowUser(!followUser);
  };

  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getMarkerColor = () => {
    if (!currentLocation) return "#666";

    // Color based on battery level
    if (currentLocation.batteryLevel !== undefined) {
      if (currentLocation.batteryLevel > 50) return "#4caf50";
      if (currentLocation.batteryLevel > 20) return "#ff9800";
      return "#f44336";
    }

    return "#2196f3";
  };

  const getAccuracyRadius = () => {
    if (!currentLocation?.accuracy) return 50; // Default radius
    return Math.max(currentLocation.accuracy, 10); // Minimum 10m radius
  };

  const formatLastUpdate = () => {
    if (!currentLocation?.timestamp) return "Never";

    const now = new Date();
    const updateTime = new Date(currentLocation.timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 6.5244, // Lagos coordinates as default
          longitude: 3.3792,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {currentLocation && (
          <>
            {/* Main location marker */}
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title={sessionInfo?.sharedBy || "Live Location"}
              description={`Last update: ${formatLastUpdate()}`}
              pinColor={getMarkerColor()}
            />

            {/* Accuracy circle */}
            {currentLocation.accuracy && (
              <Circle
                center={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                radius={getAccuracyRadius()}
                strokeColor="rgba(33, 150, 243, 0.3)"
                fillColor="rgba(33, 150, 243, 0.1)"
                strokeWidth={2}
              />
            )}
          </>
        )}
      </MapView>

      {/* Overlay controls */}
      <View style={styles.overlay}>
        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusInfo}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: sessionInfo?.isActive
                    ? "#4caf50"
                    : "#f44336",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {sessionInfo?.isActive ? "Live" : "Offline"}
            </Text>
            <Text style={styles.connectionText}>
              {isConnected ? "Real-time" : "Polling"}
            </Text>
          </View>

          {currentLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.coordinates}>
                {currentLocation.latitude.toFixed(6)},{" "}
                {currentLocation.longitude.toFixed(6)}
              </Text>
              {currentLocation.accuracy && (
                <Text style={styles.accuracy}>
                  ±{currentLocation.accuracy.toFixed(0)}m
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Control buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              followUser && styles.activeControlButton,
            ]}
            onPress={toggleFollowUser}
          >
            <Text
              style={[
                styles.controlButtonText,
                followUser && styles.activeControlButtonText,
              ]}
            >
              Follow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnLocation}
            disabled={!currentLocation}
          >
            <Text style={styles.controlButtonText}>Center</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  statusBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 15,
  },
  connectionText: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationInfo: {
    alignItems: "center",
  },
  coordinates: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196f3",
    marginBottom: 2,
  },
  accuracy: {
    fontSize: 12,
    color: "#666",
  },
  controls: {
    position: "absolute",
    bottom: 50,
    right: 20,
    flexDirection: "column",
  },
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeControlButton: {
    backgroundColor: "#2196f3",
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  activeControlButtonText: {
    color: "white",
  },
});
