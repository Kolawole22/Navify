import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaContainer } from "../../components/SafeAreaContainer";
import { useLiveLocationSharing } from "../../hooks/useLiveLocation";
import { useLiveLocationSessions } from "../../hooks/useLiveLocation";
import Button from "@/components/Button";

export default function LiveLocationSharingScreen() {
  const [sessionName, setSessionName] = useState("");
  const [duration, setDuration] = useState("");
  const [personalCodes, setPersonalCodes] = useState("");
  const [isIndefinite, setIsIndefinite] = useState(true);

  const { isTracking, currentSessionId, startSharing, stopSharing, isLoading } =
    useLiveLocationSharing();
  const { data: sessions, isLoading: sessionsLoading } =
    useLiveLocationSessions();

  const handleStartSharing = async () => {
    if (!sessionName.trim()) {
      Alert.alert("Error", "Please enter a session name");
      return;
    }

    if (!personalCodes.trim()) {
      Alert.alert("Error", "Please enter at least one personal code");
      return;
    }

    const personalCodesList = personalCodes
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    if (personalCodesList.length === 0) {
      Alert.alert("Error", "Please enter valid personal codes");
      return;
    }

    try {
      const durationMinutes = isIndefinite ? undefined : parseInt(duration);

      await startSharing({
        sessionName: sessionName.trim(),
        duration: durationMinutes,
        sharedWithPersonalCodes: personalCodesList,
      });

      Alert.alert("Success", "Live location sharing started!");

      // Reset form
      setSessionName("");
      setDuration("");
      setPersonalCodes("");
    } catch (error) {
      Alert.alert("Error", "Failed to start live location sharing");
      console.error("Error starting sharing:", error);
    }
  };

  const handleStopSharing = async () => {
    try {
      await stopSharing();
      Alert.alert("Success", "Live location sharing stopped!");
    } catch (error) {
      Alert.alert("Error", "Failed to stop live location sharing");
      console.error("Error stopping sharing:", error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours} hours`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0
        ? `${days}d ${remainingHours}h`
        : `${days} days`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <SafeAreaContainer className="flex-1">
      <ScrollView className="flex-1 p-5">
        {isTracking ? (
          <View className="bg-green-50 border border-green-500 p-5 rounded-xl mb-5">
            <View className="flex-row items-center mb-2">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <Text className="text-base font-bold text-green-600">
                Currently Sharing
              </Text>
            </View>
            <Text className="text-sm text-neutral-600 mb-4">
              Session: {currentSessionId}
            </Text>
            <TouchableOpacity
              className="bg-red-500 p-3 rounded-lg items-center"
              onPress={handleStopSharing}
              disabled={isLoading}
            >
              <Text className="text-white text-base font-bold">
                {isLoading ? "Stopping..." : "Stop Sharing"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mb-8">
            <Text className="text-lg font-bold mb-4">Start New Session</Text>

            <View className="mb-5">
              <Text className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                Session Name
              </Text>
              <TextInput
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-base bg-white dark:bg-neutral-900"
                value={sessionName}
                onChangeText={setSessionName}
                placeholder="e.g., Going to work"
                placeholderTextColor="#666"
              />
            </View>

            <View className="mb-5">
              <View className="mb-2">
                <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                  Duration
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-neutral-700">Indefinite</Text>
                  <Switch
                    value={isIndefinite}
                    onValueChange={setIsIndefinite}
                  />
                </View>
              </View>

              {!isIndefinite && (
                <TextInput
                  className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-base bg-white dark:bg-neutral-900"
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Duration in minutes"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              )}
            </View>

            <View className="mb-5">
              <Text className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                Share With (Personal Codes)
              </Text>
              <TextInput
                className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-base bg-white dark:bg-neutral-900 h-20 text-top"
                value={personalCodes}
                onChangeText={setPersonalCodes}
                placeholder="Enter personal codes separated by commas"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
              <Text className="text-xs text-neutral-500 mt-1">
                Enter the 8-digit personal codes of people you want to share
                your location with
              </Text>
            </View>

            <Button
              onPress={handleStartSharing}
              disabled={isLoading}
              loading={isLoading}
            >
              Start Sharing
            </Button>
          </View>
        )}

        <View className="mt-5">
          <Text className="text-lg font-bold mb-4">Previous Sessions</Text>

          {sessionsLoading ? (
            <Text className="text-center text-neutral-500 italic">
              Loading sessions...
            </Text>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <View
                key={session.id}
                className="bg-white dark:bg-neutral-900 p-4 rounded-lg mb-3 border border-neutral-200 dark:border-neutral-700"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base font-bold flex-1">
                    {session.sessionName}
                  </Text>
                  <View
                    className={
                      session.isActive
                        ? "px-2 py-1 rounded-2xl bg-green-50"
                        : "px-2 py-1 rounded-2xl bg-red-50"
                    }
                  >
                    <Text
                      className={
                        session.isActive
                          ? "text-xs font-bold text-green-600"
                          : "text-xs font-bold text-red-600"
                      }
                    >
                      {session.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-neutral-600 mb-1">
                  Duration:{" "}
                  {session.duration
                    ? formatDuration(session.duration)
                    : "Indefinite"}
                </Text>

                {session.expiresAt && (
                  <Text className="text-sm text-neutral-600 mb-1">
                    Expires: {formatDate(session.expiresAt)}
                  </Text>
                )}

                <Text className="text-sm text-neutral-600 mb-1">
                  Shared with: {session.shareCount} people
                </Text>

                <Text className="text-sm text-neutral-600 mb-1">
                  Created: {formatDate(session.createdAt)}
                </Text>

                {session.lastLocationUpdate && (
                  <Text className="text-sm text-neutral-600">
                    Last update: {formatDate(session.lastLocationUpdate)}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text className="text-center text-neutral-500 italic mt-5">
              No previous sessions found
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}
