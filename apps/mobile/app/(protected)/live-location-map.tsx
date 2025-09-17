import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaContainer } from "../../components/SafeAreaContainer";
import LiveLocationMap from "../../components/LiveLocationMap";
import { useLiveLocation } from "../../hooks/useLiveLocation";

export default function LiveLocationMapScreen() {
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

  const handleLocationUpdate = (location: any) => {
    setLocationData(location);
  };

  const handleSessionStatusChange = (isActive: boolean) => {
    if (!isActive) {
      Alert.alert("Session Ended", "The live location session has ended");
      setIsConnected(false);
    }
  };

  return (
    <SafeAreaContainer className="flex-1">
      <View className="flex-1">
        {!isConnected ? (
          <View className="flex-1 p-5 justify-center">
            <Text className="text-2xl font-bold mb-2 text-center text-primary">
              Live Location Map
            </Text>
            <Text className="text-base text-neutral-500 text-center mb-10">
              Connect to view live location on map
            </Text>

            <View className="mb-6">
              <Text className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                Session ID
              </Text>
              <TextInput
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-base bg-white dark:bg-neutral-900"
                value={sessionId}
                onChangeText={setSessionId}
                placeholder="Enter session ID"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-6">
              <Text className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                Your Personal Code
              </Text>
              <TextInput
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-base bg-white dark:bg-neutral-900"
                value={personalCode}
                onChangeText={(text) => setPersonalCode(text.toUpperCase())}
                placeholder="Enter your 8-digit personal code"
                placeholderTextColor="#666"
                autoCapitalize="characters"
                maxLength={8}
              />
              <Text className="text-xs text-neutral-500 mt-1 leading-4">
                Enter the 8-digit personal code you received from the person
                sharing their location
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary p-4 rounded-lg items-center mt-5"
              onPress={handleConnect}
            >
              <Text className="text-white text-base font-bold">
                Connect to Map
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <LiveLocationMap
              sessionId={sessionId}
              personalCode={personalCode}
              sessionInfo={sessionInfo}
              onLocationUpdate={handleLocationUpdate}
              onSessionStatusChange={handleSessionStatusChange}
            />

            <TouchableOpacity
              className="absolute top-12 right-5 bg-red-500/90 px-4 py-2 rounded-md z-50"
              onPress={handleDisconnect}
            >
              <Text className="text-white text-sm font-semibold">
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaContainer>
  );
}
