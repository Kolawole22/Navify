import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Share,
  useWindowDimensions,
  Alert,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TextNormal, H2, H3, Body } from "@/components/Typography";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import Button from "@/components/Button";
import * as Clipboard from "expo-clipboard";
import AddressPrintPreview from "@/components/AddressPrintPreview";
import { PrintService } from "@/services/printService";
import PrintSettingsModal, {
  PrintSettings,
} from "@/components/PrintSettingsModal";
import { useUserProfile } from "@/services/authService";
import { Address, useAddressById } from "@/services/addressService";

export default function AddressDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [isCopied, setIsCopied] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    showBranding: true,
    customBranding: "Navify",
    showQRCode: true,
    showCoordinates: false,
    cardSize: "medium",
    orientation: "portrait",
  });
  const { width, height } = useWindowDimensions();
  const ASPECT_RATIO = width / height;

  const { data: address, isLoading, error } = useAddressById(params.id);

  // Extract and convert params safely
  const code = typeof address?.hhgCode === "string" ? address?.hhgCode : "";
  const name = typeof address?.street === "string" ? address?.street : "";
  const latitude =
    typeof address?.latitude === "string"
      ? parseFloat(address?.latitude)
      : 9.082;
  const longitude =
    typeof address?.longitude === "string"
      ? parseFloat(address?.longitude)
      : 8.6753;

  // Reset copy indication after 3 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(code);
    setIsCopied(true);
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this location on Navify: ${code}\nLocation: ${name}\nhttps://navify.app/address/${code}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the address");
    }
  };

  const handleNavigate = () => {
    // This would integrate with your navigation feature
    // For now, we'll just show a simple alert
    Alert.alert(
      "Navigation Starting",
      "Turn-by-turn navigation would start here",
      [{ text: "OK" }]
    );
  };

  const handleGoToGoogleMaps = () => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    );
  };

  const { data } = useUserProfile();
  const user = data?.user;

  console.log("address", address);
  console.log("params", params);

  const handlePrintAddress = async () => {
    try {
      // Create a mock address object for now - this should be replaced with actual address data
      const userAddress = {
        id: user?.id ? parseInt(user.id) : 1,
        userId: user?.id || "user123",
        hhgCode: code,
        areaCode: address?.areaCode || "KWLR",
        areaType: address?.areaType || "TNK",
        locationNumber: address?.locationNumber || "214",
        houseNumber: address?.houseNumber || "180",
        generatedHouseNumber: address?.generatedHouseNumber || "8740",
        city: address?.city || name,
        street: address?.street || "Street",
        stateCode: address?.stateCode || "LA",
        lgaCode: address?.lgaCode || "LGA001",
        estate: address?.estate || "Estate",
        floor: address?.floor || 1,
        landmark: address?.landmark || "Landmark",
        specialDescription: address?.specialDescription || "",
        category: address?.category || "residential",
        photoUrls: address?.photoUrls || [],
        isSaved: address?.isSaved || true,
        label: address?.label || "Home",
        latitude: address?.latitude || latitude.toString(),
        longitude: address?.longitude || longitude.toString(),
        createdAt: address?.createdAt || new Date().toISOString(),
        updatedAt: address?.updatedAt || new Date().toISOString(),
      };

      await PrintService.printAddressCard(userAddress);
    } catch (error) {
      Alert.alert("Error", "Failed to print address card");
    }
  };

  const handleShareAsPDF = async () => {
    try {
      // Create a mock address object for now - this should be replaced with actual address data
      const userAddress = {
        id: address?.id || 1,
        userId: user?.id || "user123",
        hhgCode: code,
        areaCode: address?.areaCode || "KWLR",
        areaType: address?.areaType || "TNK",
        locationNumber: address?.locationNumber || "214",
        houseNumber: address?.houseNumber || "180",
        generatedHouseNumber: address?.generatedHouseNumber || "8740",
        city: name,
        street: address?.street || "Street",
        stateCode: address?.stateCode || "LA",
        lgaCode: address?.lgaCode || "LGA001",
        estate: address?.estate || "Estate",
        floor: 1,
        landmark: address?.landmark || "Landmark",
        specialDescription: address?.specialDescription || "",
        category: address?.category || "residential",
        photoUrls: address?.photoUrls || [],
        isSaved: address?.isSaved || true,
        label: address?.label || "Home",
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        createdAt: address?.createdAt || new Date().toISOString(),
        updatedAt: address?.updatedAt || new Date().toISOString(),
      };

      await PrintService.shareAddressCardAsPDF(userAddress);
    } catch (error) {
      Alert.alert("Error", "Failed to share address card");
    }
  };

  const initialRegion = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005 * ASPECT_RATIO,
  };

  if (isLoading) {
    return (
      <SafeAreaContainer className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <TextNormal>Loading...</TextNormal>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer className="flex-1 bg-white">
      <Stack.Screen
        options={{
          headerTitle: "Address Details",
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="flex-1">
        {/* Map Preview */}
        <View className="w-full h-56 ">
          <MapView
            className="w-full h-full"
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
          >
            <Marker coordinate={{ latitude, longitude }}>
              <View className="items-center">
                <View className="w-3 h-3 rounded-full bg-[#E53935]" />
                <View className="bg-[#E53935] px-2 py-1 rounded mt-1">
                  <TextNormal className="text-white text-xs font-bold">
                    {name || "Address"}
                  </TextNormal>
                </View>
              </View>
            </Marker>
          </MapView>
        </View>

        {/* Address Code Section */}
        <View className="p-5">
          <View className="bg-gray-50 rounded-lg mb-6">
            <TextNormal className="text-gray-500 mb-1">
              Navify Address Code
            </TextNormal>
            <View className="flex-row items-center justify-between">
              <H3 className="text-[#005C3E]">{code}</H3>
              <Pressable
                onPress={handleCopyCode}
                className="flex-row items-center"
              >
                <Ionicons
                  name={isCopied ? "checkmark-circle" : "copy-outline"}
                  size={24}
                  color={isCopied ? "#00AA00" : "#005C3E"}
                />
                <TextNormal
                  className={`ml-1 ${
                    isCopied ? "text-green-600" : "text-[#005C3E]"
                  }`}
                >
                  {isCopied ? "Copied" : "Copy"}
                </TextNormal>
              </Pressable>
            </View>
          </View>

          {/* Location Details */}
          <H3 className="mb-2">{name || "Address"}</H3>

          {/* House Number Section - Prominently Display Generated Number */}
          {address?.generatedHouseNumber && (
            <View className="bg-[#005C3E] rounded-lg p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <TextNormal className="text-white/80 text-sm mb-1">
                    Navify House Number
                  </TextNormal>
                  <H2 className="text-white font-bold">
                    {address.generatedHouseNumber}
                  </H2>
                </View>
                <Ionicons name="home-outline" size={32} color="white" />
              </View>
            </View>
          )}

          {/* User-Provided House Number (Secondary) */}
          {address?.houseNumber &&
            address.houseNumber !== address?.generatedHouseNumber && (
              <View className="bg-gray-100 rounded-lg p-3 mb-4">
                <TextNormal className="text-gray-600 text-sm mb-1">
                  Building Number
                </TextNormal>
                <TextNormal className="text-gray-800 font-medium">
                  {address.houseNumber}
                </TextNormal>
              </View>
            )}

          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#666" />
            <TextNormal className="text-gray-600 ml-1">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </TextNormal>
          </View>

          {/* Print Preview Section */}
          <View className="mb-6">
            <H3 className="mb-3">Print Preview</H3>
            <AddressPrintPreview
              address={{
                id: 1,
                userId: "user123",
                hhgCode: code,
                areaCode: address?.areaCode || "KWLR",
                areaType: address?.areaType || "TNK",
                locationNumber: address?.locationNumber || "214",
                houseNumber: address?.houseNumber || "180",
                generatedHouseNumber: address?.generatedHouseNumber || "8740",
                city: name,
                street: address?.street || "Street",
                stateCode: address?.stateCode || "LA",
                lgaCode: address?.lgaCode || "LGA001",
                estate: address?.estate || "Estate",
                floor: address?.floor || 1,
                landmark: address?.landmark || "Landmark",
                specialDescription: address?.specialDescription || "",
                category: address?.category || "residential",
                photoUrls: address?.photoUrls || [],
                isSaved: address?.isSaved || true,
                label: address?.label || "Home",
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                createdAt: address?.createdAt || new Date().toISOString(),
                updatedAt: address?.updatedAt || new Date().toISOString(),
              }}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row mb-6">
            <View className="flex-1 mr-2">
              <Button
                onPress={handleShare}
                variant="secondary"
                className="border-[#005C3E]"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="#005C3E"
                  />
                  <TextNormal className="text-[#005C3E] ml-2">Share</TextNormal>
                </View>
              </Button>
            </View>

            <View className="flex-1 ml-2">
              <Button onPress={handleGoToGoogleMaps} className="bg-[#005C3E]">
                <View className="flex-row items-center justify-center">
                  <Ionicons name="navigate-outline" size={18} color="white" />
                  <TextNormal className="text-white ml-2">
                    Google Maps
                  </TextNormal>
                </View>
              </Button>
            </View>
          </View>

          {/* Print Actions */}
          <View className="flex-row mb-6">
            <View className="flex-1 mr-2">
              <Button
                onPress={handlePrintAddress}
                variant="secondary"
                className="border-[#005C3E]"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="print-outline" size={18} color="#005C3E" />
                  <TextNormal className="text-[#005C3E] ml-2">Print</TextNormal>
                </View>
              </Button>
            </View>

            <View className="flex-1 ml-2">
              <Button onPress={handleShareAsPDF} className="bg-[#005C3E]">
                <View className="flex-row items-center justify-center">
                  <Ionicons name="document-outline" size={18} color="white" />
                  <TextNormal className="text-white ml-2">Share PDF</TextNormal>
                </View>
              </Button>
            </View>
          </View>

          {/* Print Settings Button */}
          <View className="mb-6">
            <Button
              onPress={() => setShowPrintSettings(true)}
              variant="secondary"
              className="border-gray-300"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="settings-outline" size={18} color="#666" />
                <TextNormal className="text-gray-600 ml-2">
                  Customize Print Settings
                </TextNormal>
              </View>
            </Button>
          </View>

          {/* Offline Notice */}
          {/* <View className="bg-blue-50 p-3 rounded-lg mb-4 flex-row items-center">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#3478F6"
            />
            <TextNormal className="text-blue-700 ml-2 flex-1">
              This address is available offline for navigation
            </TextNormal>
          </View> */}
        </View>
      </ScrollView>

      {/* Print Settings Modal */}
      <PrintSettingsModal
        visible={showPrintSettings}
        onClose={() => setShowPrintSettings(false)}
        onSave={(settings) => setPrintSettings(settings)}
        currentSettings={printSettings}
      />
    </SafeAreaContainer>
  );
}
