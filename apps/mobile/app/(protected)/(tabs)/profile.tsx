import React from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { TextNormal, H2, Body, TextBold } from "@/components/Typography";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { useUserProfile } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: profile, isLoading, error } = useUserProfile();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("../edit-profile");
  };

  const handleViewAddresses = () => {
    router.push("/(protected)/(tabs)/more");
  };

  const handleAddAddress = () => {
    router.push("/(protected)/create-address");
  };

  const handleViewLocationHistory = () => {
    router.push("../location-history");
  };

  const handleViewNotifications = () => {
    router.push("../notifications");
  };

  const handleViewSettings = () => {
    router.push("../settings");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getActivityIcon = (activity: string | null) => {
    switch (activity) {
      case "search":
        return "search";
      case "navigation":
        return "navigate";
      case "visit":
        return "location";
      default:
        return "location-outline";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaContainer edges={["top"]} className="bg-white flex-1">
        <View className="flex-1 justify-center items-center">
          <TextNormal>Loading profile...</TextNormal>
        </View>
      </SafeAreaContainer>
    );
  }

  if (error) {
    return (
      <SafeAreaContainer edges={["top"]} className="bg-white flex-1">
        <View className="flex-1 justify-center items-center p-5">
          <TextNormal>Failed to load profile</TextNormal>
          <Button onPress={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer edges={["top"]} className="bg-gray-50 flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with gradient background */}
        {/* <LinearGradient colors={["#005C3E", "#007A52"]} className="pt-5 pb-8">
          <View className="flex-row justify-between items-center px-5">
            <H2 className="text-white text-2xl font-bold">My Profile</H2>
            <TouchableOpacity onPress={handleViewSettings} className="p-2">
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient> */}
        <View className="pt-5 pb-8 bg-[#005C3E]">
          <View className="flex-row justify-between items-center px-5">
            <H2 className="text-white text-2xl font-bold">My Profile</H2>
            <TouchableOpacity onPress={handleViewSettings} className="p-2">
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info Card */}
        <View className="bg-white mx-5 -mt-4 rounded-2xl p-5 shadow-lg">
          <View className="flex-row items-center">
            <View className="w-[70px] h-[70px] rounded-full bg-[#005C3E] justify-center items-center mr-4">
              <TextNormal className="text-white text-2xl font-bold">
                {getInitials(profile?.user.firstName, profile?.user.lastName)}
              </TextNormal>
            </View>
            <View className="flex-1">
              <TextNormal className="text-xl font-bold mb-1 text-gray-800">
                {profile?.user.fullName || user?.name || "User"}
              </TextNormal>
              <Body className="text-gray-500 mb-1">
                {profile?.user.email || user?.email || "email@example.com"}
              </Body>
              <Body className="text-gray-400 text-sm">
                Member since{" "}
                {formatDate(
                  profile?.user.createdAt || new Date().toISOString()
                )}
              </Body>
            </View>
          </View>
          <Button
            onPress={handleEditProfile}
            className="mt-4 bg-[#005C3E]"
            textClassName="text-white"
          >
            Edit Profile
          </Button>
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-around px-5 mb-5">
          <View className="bg-white rounded-xl p-4 items-center flex-1 mx-1 shadow-sm">
            <Ionicons name="location" size={24} color="#005C3E" />
            <TextNormal className="text-2xl font-bold text-gray-800 mt-2">
              {profile?.stats.totalAddresses || 0}
            </TextNormal>
            <Body className="text-gray-500 mt-1 text-sm">Addresses</Body>
          </View>
          <View className="bg-white rounded-xl p-4 items-center flex-1 mx-1 shadow-sm">
            <Ionicons name="map" size={24} color="#005C3E" />
            <TextNormal className="text-2xl font-bold text-gray-800 mt-2">
              {profile?.stats.totalLocations || 0}
            </TextNormal>
            <Body className="text-gray-500 mt-1 text-sm">Locations</Body>
          </View>
          <View className="bg-white rounded-xl p-4 items-center flex-1 mx-1 shadow-sm">
            <Ionicons name="notifications" size={24} color="#005C3E" />
            <TextNormal className="text-2xl font-bold text-gray-800 mt-2">
              {profile?.stats.unreadNotifications || 0}
            </TextNormal>
            <Body className="text-gray-500 mt-1 text-sm">Notifications</Body>
          </View>
        </View>

        {/* Recent Addresses */}
        {profile?.recentAddresses && profile.recentAddresses.length > 0 && (
          <View className="bg-white mx-5 mb-5 rounded-2xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <H2 className="text-lg font-bold text-gray-800">
                Recent Addresses
              </H2>
              {/* <TouchableOpacity onPress={handleViewAddresses}>
                <TextNormal className="text-[#005C3E] font-medium">
                  View All
                </TextNormal>
              </TouchableOpacity> */}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {profile.recentAddresses.slice(0, 3).map((address) => (
                <TouchableOpacity
                  key={address.id}
                  className="bg-gray-50 rounded-xl p-4 mr-3 min-w-[200px]"
                  onPress={() =>
                    router.push({
                      pathname: "/(protected)/address-detail",
                      params: {
                        code: address.hhgCode,
                        name: address.street || address.landmark || "Address",
                        lat: address.latitude,
                        lng: address.longitude,
                      },
                    })
                  }
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="location" size={16} color="#005C3E" />
                    <Body className="text-[#005C3E] font-medium ml-1 text-sm">
                      {address.hhgCode}
                    </Body>
                  </View>
                  <Body className="text-gray-800 mb-1">
                    {address.street || address.landmark || "Address"}
                  </Body>
                  {address.city && (
                    <Body className="text-gray-500 text-sm">
                      {address.city}
                    </Body>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Locations */}
        {profile?.recentLocations && profile.recentLocations.length > 0 && (
          <View className="bg-white mx-5 mb-5 rounded-2xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <H2 className="text-lg font-bold text-gray-800">
                Recent Activity
              </H2>
              <TouchableOpacity onPress={handleViewLocationHistory}>
                <TextNormal className="text-[#005C3E] font-medium">
                  View All
                </TextNormal>
              </TouchableOpacity>
            </View>
            {profile.recentLocations.slice(0, 3).map((location) => (
              <View
                key={location.id}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <View className="w-10 h-10 rounded-full bg-blue-50 justify-center items-center mr-3">
                  <Ionicons
                    name={getActivityIcon(location.activity) as any}
                    size={20}
                    color="#005C3E"
                  />
                </View>
                <View className="flex-1">
                  <Body className="text-gray-800 mb-0.5">
                    {location.activity
                      ? location.activity.charAt(0).toUpperCase() +
                        location.activity.slice(1)
                      : "Location visited"}
                  </Body>
                  <Body className="text-gray-500 text-sm">
                    {formatDate(location.visitedAt)}
                  </Body>
                </View>
                <View className="items-end">
                  <Body className="text-gray-400 text-xs">
                    {parseFloat(location.latitude).toFixed(4)},{" "}
                    {parseFloat(location.longitude).toFixed(4)}
                  </Body>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View className="bg-white mx-5 mb-5 rounded-2xl p-5 shadow-sm">
          <H2 className="text-lg font-bold text-gray-800 mb-4">
            Quick Actions
          </H2>
          <View className="flex-row justify-around">
            <TouchableOpacity
              className="items-center p-4 rounded-xl bg-gray-50 min-w-[80px]"
              onPress={handleAddAddress}
            >
              <Ionicons name="add-circle" size={24} color="#005C3E" />
              <TextNormal className="text-gray-800 mt-2 text-xs text-center">
                Add Address
              </TextNormal>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center p-4 rounded-xl bg-gray-50 min-w-[80px]"
              onPress={handleViewNotifications}
            >
              <Ionicons name="notifications" size={24} color="#005C3E" />
              <TextNormal className="text-gray-800 mt-2 text-xs text-center">
                Notifications
              </TextNormal>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center p-4 rounded-xl bg-gray-50 min-w-[80px]"
              onPress={handleViewSettings}
            >
              <Ionicons name="settings" size={24} color="#005C3E" />
              <TextNormal className="text-gray-800 mt-2 text-xs text-center">
                Settings
              </TextNormal>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-5 pb-5">
          <Button
            onPress={handleLogout}
            className="bg-red-500 items-center gap-4"
          >
            {/* <Ionicons name="log-out-outline" size={20} color="white" /> */}
            <TextBold className="text-white">Logout</TextBold>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}
