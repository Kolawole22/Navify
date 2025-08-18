import React, { useState } from "react";
import { View, ScrollView, Switch, Pressable, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import Button from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import {
  usePreferences,
  useUpdatePreferences,
  UserPreferences,
} from "@/services/authService";

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  // Backend preferences hooks
  const { data, isLoading, error } = usePreferences();
  const { mutate: updatePreferences, isPending: isSaving } =
    useUpdatePreferences();

  // Local state mirrors backend preferences
  const [settings, setSettings] = useState<UserPreferences>({
    darkMode: false,
    notifications: true,
    language: "English",
    units: "Metric",
  });

  // Sync local state with backend data
  React.useEffect(() => {
    if (data?.preferences) setSettings(data.preferences);
  }, [data]);

  // Update backend when a setting changes
  const handleUpdate = (newSettings: Partial<UserPreferences>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    updatePreferences(updated);
  };

  // Language options
  const languages = ["English", "Yoruba", "Hausa", "Igbo", "Pidgin"];
  // Unit options
  const units = ["Metric", "Imperial"];

  // Toggle switches
  const toggleSetting = (setting: keyof UserPreferences) => {
    handleUpdate({ [setting]: !settings[setting] });
  };

  // Select language
  const selectLanguage = () => {
    Alert.alert(
      "Select Language",
      "Choose your preferred language",
      languages.map((lang) => ({
        text: lang,
        onPress: () => handleUpdate({ language: lang }),
      }))
    );
  };

  // Select units
  const selectUnits = () => {
    Alert.alert(
      "Select Units",
      "Choose your preferred measurement units",
      units.map((unit) => ({
        text: unit,
        onPress: () => handleUpdate({ units: unit }),
      }))
    );
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Clear data
  const clearData = () => {
    Alert.alert(
      "Clear Data",
      "Are you sure you want to clear all saved locations and history?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            // Would clear local data here
            Alert.alert("Success", "All data has been cleared");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaContainer className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle: "Settings",
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <TextNormal>Loading preferences...</TextNormal>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <TextNormal className="text-red-500">
            Failed to load preferences
          </TextNormal>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* App Preferences */}
          <View className="p-4 border-b border-gray-100">
            <H2 className="mb-4">App Preferences</H2>

            <View className="mb-6">
              {/* Dark Mode */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="moon-outline" size={22} color="#005C3E" />
                  <TextNormal className="ml-3">Dark Mode</TextNormal>
                </View>
                <Switch
                  value={!!settings.darkMode}
                  onValueChange={() => toggleSetting("darkMode")}
                  trackColor={{ false: "#D1D5DB", true: "#007F57" }}
                  thumbColor="#FFFFFF"
                  disabled={isSaving}
                />
              </View>

              {/* Notifications */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#005C3E"
                  />
                  <TextNormal className="ml-3">Notifications</TextNormal>
                </View>
                <Switch
                  value={!!settings.notifications}
                  onValueChange={() => toggleSetting("notifications")}
                  trackColor={{ false: "#D1D5DB", true: "#007F57" }}
                  thumbColor="#FFFFFF"
                  disabled={isSaving}
                />
              </View>

              {/* Language */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={selectLanguage}
                disabled={isSaving}
              >
                <View className="flex-row items-center">
                  <Ionicons name="language-outline" size={22} color="#005C3E" />
                  <TextNormal className="ml-3">Language</TextNormal>
                </View>
                <View className="flex-row items-center">
                  <TextNormal className="text-gray-500 mr-2">
                    {settings.language}
                  </TextNormal>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </View>
              </Pressable>

              {/* Units */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={selectUnits}
                disabled={isSaving}
              >
                <View className="flex-row items-center">
                  <Ionicons name="options-outline" size={22} color="#005C3E" />
                  <TextNormal className="ml-3">Units</TextNormal>
                </View>
                <View className="flex-row items-center">
                  <TextNormal className="text-gray-500 mr-2">
                    {settings.units}
                  </TextNormal>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </View>
              </Pressable>

              {/* Location History */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={() => router.push("/(protected)/location-history")}
              >
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={22} color="#005C3E" />
                  <TextNormal className="ml-3">Location History</TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>

              {/* Notifications */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={() => router.push("/(protected)/notifications")}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#005C3E"
                  />
                  <TextNormal className="ml-3">Notifications</TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>

              {/* Address Sharing */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={() => router.push("/(protected)/address-sharing")}
              >
                <View className="flex-row items-center">
                  <Ionicons name="share-outline" size={22} color="#005C3E" />
                  <TextNormal className="ml-3">Address Sharing</TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>
            </View>
          </View>

          {/* Privacy and Data */}
          <View className="p-4 border-b border-gray-100">
            <H2 className="mb-4">Privacy & Data</H2>

            <View className="mb-6">
              {/* Clear Data */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={clearData}
                disabled={isSaving}
              >
                <View className="flex-row items-center">
                  <Ionicons name="trash-outline" size={22} color="#E53935" />
                  <TextNormal className="ml-3 text-red-500">
                    Clear Saved Data
                  </TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>
            </View>
          </View>

          {/* About */}
          <View className="p-4 border-b border-gray-100">
            <H2 className="mb-4">About</H2>

            <View className="mb-6">
              {/* About Navify */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={() => Alert.alert("About", "Navify - Version 1.0.0")}
                disabled={isSaving}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#005C3E"
                  />
                  <TextNormal className="ml-3">About Navify</TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>

              {/* Privacy Policy */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={() =>
                  Alert.alert(
                    "Privacy Policy",
                    "Privacy policy would be shown here"
                  )
                }
                disabled={isSaving}
              >
                <View className="flex-row items-center">
                  <Ionicons name="shield-outline" size={22} color="#005C3E" />
                  <TextNormal className="ml-3">Privacy Policy</TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>

              {/* Terms of Service */}
              <Pressable
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
                onPress={() =>
                  Alert.alert("Terms", "Terms of service would be shown here")
                }
                disabled={isSaving}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color="#005C3E"
                  />
                  <TextNormal className="ml-3">Terms of Service</TextNormal>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>
            </View>
          </View>

          {/* Logout button */}
          <View className="p-4 pt-6">
            <Button
              onPress={handleLogout}
              className="bg-[#E53935]"
              disabled={isSaving}
            >
              {isSaving ? "Logging Out..." : "Logout"}
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaContainer>
  );
}
