import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { H2, TextNormal, Body } from "@/components/Typography";
import Button from "@/components/Button";
import { useUserProfile } from "@/services/authService";
import { extractPersonalCodeFromProfile } from "@/services/personalCodeService";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/ToastProvider";

export default function GeneratePersonalCodeScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // Get profile data which includes personal code
  const { data: profile, isLoading } = useUserProfile();
  const personalCodeData = profile
    ? extractPersonalCodeFromProfile(profile)
    : null;

  const handleCopyPersonalCode = async () => {
    if (personalCodeData?.personalCode) {
      await Clipboard.setStringAsync(personalCodeData.personalCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast({
        message: "Personal code copied to clipboard!",
        type: "success",
      });
    }
  };

  const handleSharePersonalCode = () => {
    if (personalCodeData?.personalCode) {
      // Implement sharing functionality
      Alert.alert(
        "Share Personal Code",
        "Sharing functionality will be implemented here."
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaContainer className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#005C3E" />
        <TextNormal className="mt-4 text-gray-600">Loading...</TextNormal>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: "Personal Code",
          headerShown: true,
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="flex-1 p-6">
        {/* Personal Code Display */}
        {personalCodeData?.hasPersonalCode && personalCodeData.personalCode ? (
          <View className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <View className="flex-row items-center justify-between mb-3">
              <H2 className="text-lg text-green-800">Your Personal Code</H2>
              <Pressable onPress={handleCopyPersonalCode}>
                <Ionicons name="copy-outline" size={20} color="#16a34a" />
              </Pressable>
            </View>
            <View className="bg-white p-3 rounded-lg border border-green-200">
              <TextNormal className="text-green-800 font-mono text-lg text-center">
                {personalCodeData.personalCode}
              </TextNormal>
            </View>
            <View className="flex-row gap-3 mt-3">
              <Pressable
                onPress={handleCopyPersonalCode}
                className="flex-1 flex-row items-center justify-center py-2 bg-green-600 rounded-lg"
              >
                <Ionicons name="copy-outline" size={16} color="white" />
                <TextNormal className="text-white ml-2">Copy</TextNormal>
              </Pressable>
              <Pressable
                onPress={handleSharePersonalCode}
                className="flex-1 flex-row items-center justify-center py-2 border border-green-600 rounded-lg"
              >
                <Ionicons name="share-outline" size={16} color="#16a34a" />
                <TextNormal className="text-green-600 ml-2">Share</TextNormal>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <TextNormal className="text-blue-800 font-medium mb-1">
                  Personal Code Not Available
                </TextNormal>
                <Body className="text-blue-700 text-sm">
                  Your personal code will be automatically generated when you
                  create your first address.
                </Body>
              </View>
            </View>
          </View>
        )}

        {/* Information */}
        <View className="bg-gray-50 p-4 rounded-lg">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <View className="ml-3 flex-1">
              <TextNormal className="text-gray-800 font-medium mb-1">
                About Personal Codes
              </TextNormal>
              <Body className="text-gray-700 text-sm">
                Your personal code is automatically generated when you sign up
                and create your first address. It combines your address
                information with your personal details to create a unique
                identifier that helps with user tracking and identification.
              </Body>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-6">
          <Button
            onPress={() => router.push("/(protected)/create-new-address")}
            className="mb-4"
          >
            Create Address
          </Button>

          <Button
            onPress={() => router.back()}
            className="bg-gray-100 border border-gray-300"
          >
            <TextNormal className="text-gray-700">Back to Profile</TextNormal>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}
