import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaContainer } from "../../components/SafeAreaContainer";
import { useLiveLocation } from "../../hooks/useLiveLocation";
import { useLiveLocationWebSocket } from "../../hooks/useLiveLocation";

export default function LiveLocationViewerScreen() {
  const [sessionId, setSessionId] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  const {
    data: liveLocationData,
    isLoading,
    error,
  } = useLiveLocation(
    sessionId,
    personalCode,
    isConnected && !!sessionId && !!personalCode
  );

  const { socket, isConnected: wsConnected } = useLiveLocationWebSocket(
    sessionId,
    personalCode,
    (data) => {
      console.log("Real-time location update:", data);
      setLocationData(data);
    },
    (data) => {
      console.log("Session status update:", data);
      if (!data.isActive) {
        Alert.alert("Session Ended", "The live location session has ended");
        setIsConnected(false);
      }
    }
  );

  useEffect(() => {
    if (liveLocationData) {
      setSessionInfo(liveLocationData.session);
      setLocationData(liveLocationData.location);
    }
  }, [liveLocationData]);

  const handleConnect = () => {
    if (!sessionId.trim()) {
      Alert.alert("Error", "Please enter a session ID");
      return;
    }

    if (!personalCode.trim()) {
      Alert.alert("Error", "Please enter your personal code");
      return;
    }

    // Validate personal code format (8 characters, 4 letters + 4 numbers)
    const codeRegex = /^[A-Z0-9]{8}$/;
    if (!codeRegex.test(personalCode.toUpperCase())) {
      Alert.alert(
        "Error",
        "Personal code must be 8 characters (4 letters + 4 numbers)"
      );
      return;
    }

    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setLocationData(null);
    setSessionInfo(null);
    setSessionId("");
    setPersonalCode("");
  };

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return "#666";
    if (accuracy <= 10) return "#4caf50";
    if (accuracy <= 50) return "#ff9800";
    return "#f44336";
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return "#666";
    if (level > 50) return "#4caf50";
    if (level > 20) return "#ff9800";
    return "#f44336";
  };

  return (
    <SafeAreaContainer className="flex-1">
      <View className="flex-1 p-5">
        {!isConnected ? (
          <View className="flex-1">
            <Text className="text-lg font-bold mb-5">
              Connect to Live Location
            </Text>

            <View className="mb-5">
              <Text className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                Session ID
              </Text>
              <TextInput
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-base bg-white dark:bg-neutral-900"
                value={sessionId}
                onChangeText={setSessionId}
                placeholder="Enter session ID"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-5">
              <Text className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                Your Personal Code
              </Text>
              <TextInput
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-base bg-white dark:bg-neutral-900"
                value={personalCode}
                onChangeText={(text) => setPersonalCode(text.toUpperCase())}
                placeholder="Enter your 8-digit personal code"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                maxLength={8}
              />
              <Text className="text-xs text-neutral-500 mt-1">
                Enter the 8-digit personal code you received from the person
                sharing their location
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary p-4 rounded-lg items-center mt-5"
              onPress={handleConnect}
            >
              <Text className="text-white text-base font-bold">Connect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold flex-1">
                {sessionInfo?.name || "Live Location Session"}
              </Text>
              <View className="flex-row items-center">
                <View
                  className={
                    sessionInfo?.isActive
                      ? "w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"
                      : "w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"
                  }
                />
                <Text className="text-sm font-semibold">
                  {sessionInfo?.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <Text className="text-sm text-neutral-600 mb-5">
              Shared by: {sessionInfo?.sharedBy || "Unknown"}
            </Text>

            {isLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#2196f3" />
                <Text className="mt-2 text-base text-neutral-600">
                  Loading location...
                </Text>
              </View>
            ) : error ? (
              <View className="flex-1 items-center justify-center p-5">
                <Text className="text-base text-red-500 text-center">
                  Error: {error.message || "Failed to load location"}
                </Text>
              </View>
            ) : locationData ? (
              <View className="flex-1 bg-white dark:bg-neutral-900 rounded-xl p-5 mb-5 border border-neutral-200 dark:border-neutral-700">
                <Text className="text-lg font-bold mb-4">Current Location</Text>

                <View className="mb-5">
                  <Text className="text-base font-bold text-primary text-center mb-4">
                    {formatLocation(
                      locationData.latitude,
                      locationData.longitude
                    )}
                  </Text>

                  {locationData.accuracy && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-neutral-600">
                        Accuracy:
                      </Text>
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: getAccuracyColor(locationData.accuracy),
                        }}
                      >
                        {locationData.accuracy.toFixed(1)}m
                      </Text>
                    </View>
                  )}

                  {locationData.speed !== null &&
                    locationData.speed !== undefined && (
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-neutral-600">Speed:</Text>
                        <Text className="text-sm font-semibold">
                          {(locationData.speed * 3.6).toFixed(1)} km/h
                        </Text>
                      </View>
                    )}

                  {locationData.heading !== null &&
                    locationData.heading !== undefined && (
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-neutral-600">
                          Heading:
                        </Text>
                        <Text className="text-sm font-semibold">
                          {locationData.heading.toFixed(0)}°
                        </Text>
                      </View>
                    )}

                  {locationData.altitude !== null &&
                    locationData.altitude !== undefined && (
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-neutral-600">
                          Altitude:
                        </Text>
                        <Text className="text-sm font-semibold">
                          {locationData.altitude.toFixed(1)}m
                        </Text>
                      </View>
                    )}

                  {locationData.batteryLevel !== null &&
                    locationData.batteryLevel !== undefined && (
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-neutral-600">
                          Battery:
                        </Text>
                        <Text
                          className="text-sm font-semibold"
                          style={{
                            color: getBatteryColor(locationData.batteryLevel),
                          }}
                        >
                          {locationData.batteryLevel}%
                          {locationData.isCharging && " (Charging)"}
                        </Text>
                      </View>
                    )}

                  <View className="flex-row justify-between">
                    <Text className="text-sm text-neutral-600">
                      Last Update:
                    </Text>
                    <Text className="text-sm font-semibold">
                      {formatTimestamp(locationData.timestamp)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-center mt-2">
                  <View
                    className={
                      wsConnected
                        ? "w-2 h-2 rounded-full bg-green-500 mr-1.5"
                        : "w-2 h-2 rounded-full bg-red-500 mr-1.5"
                    }
                  />
                  <Text className="text-xs text-neutral-600">
                    {wsConnected ? "Real-time connected" : "Polling mode"}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-base text-neutral-600 italic">
                  No location data available
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="bg-red-500 p-4 rounded-lg items-center"
              onPress={handleDisconnect}
            >
              <Text className="text-white text-base font-bold">Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaContainer>
  );
}
