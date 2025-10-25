import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";

import { Address } from "@/services/addressService";

interface AddressPrintPreviewProps {
  address: Address;
  showPreview?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width - 40, 350);
const CARD_HEIGHT = 500;

export default function AddressPrintPreview({
  address,
  showPreview = true,
}: AddressPrintPreviewProps) {
  // Use the actual address data from the database
  const areaCode = address.areaCode || "KWLR";
  const areaType = address.areaType || "TNK";
  const locationNumber = address.locationNumber || "214";
  const houseNumber = address.houseNumber || "180";
  const generatedHouseNumber = address.generatedHouseNumber || "8740";

  // Use stored QR code URL or fallback to backend generation
  const getQRCodeURL = (): string => {
    if (address.qrCodeImageUrl) {
      return address.qrCodeImageUrl;
    }
    // Fallback to backend generation if no stored URL
    const baseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.100:3006/api";
    return `${baseUrl}/qr-code/${encodeURIComponent(address.hhgCode)}`;
  };

  return (
    <View style={[styles.container, showPreview && styles.previewContainer]}>
      <View style={styles.card}>
        {/* Left black strip */}
        <View style={styles.blackStrip}>
          <Text style={styles.blackStripText}>{areaCode}</Text>
          <Text style={styles.blackStripText}>{areaType}</Text>
          <Text style={styles.blackStripText}>{locationNumber}</Text>
          <Text style={styles.blackStripText}>{houseNumber}</Text>
        </View>

        {/* Main yellow content */}
        <View style={styles.yellowContent}>
          {/* Header section with branding */}
          <View style={styles.headerSection}>
            <View style={styles.brandingSection}>
              <Text style={styles.brandingText}>Google Play</Text>
              <Text style={styles.brandingText}>Navify</Text>
              <Text style={styles.brandingText}>ng@navify.co</Text>
              <Text style={styles.brandingText}>Ajah, Lagos</Text>
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: getQRCodeURL() }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Address details section */}
          <View style={styles.addressSection}>
            <View style={styles.addressRow}>
              <Text style={styles.label}>CITY</Text>
              <Text style={styles.value}>{address.city || ""}</Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.label}>AREA</Text>
              <Text style={styles.value}>
                {address.estate || address.landmark || ""}
              </Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.label}>STREET No.</Text>
              <Text style={styles.value}>{address.street || ""}</Text>
            </View>
            <View style={styles.addressRow}>
              <Text style={styles.label}>NAVIFY HOUSE No.</Text>
              <Text style={styles.value}>{generatedHouseNumber}</Text>
            </View>
            {address.houseNumber &&
              address.houseNumber !== generatedHouseNumber && (
                <View style={styles.addressRow}>
                  <Text style={styles.label}>USER HOUSE No.</Text>
                  <Text style={styles.value}>{address.houseNumber}</Text>
                </View>
              )}
          </View>

          {/* Large house number display - Show generated number prominently */}
          <View style={styles.largeNumberContainer}>
            <Text style={styles.largeNumber}>{generatedHouseNumber}</Text>
            {address.houseNumber &&
              address.houseNumber !== generatedHouseNumber && (
                <Text style={styles.secondaryNumber}>
                  Building: {address.houseNumber}
                </Text>
              )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
  },
  previewContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginVertical: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    flexDirection: "row",
    backgroundColor: "#FFD700", // Yellow background
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  blackStrip: {
    width: 60,
    backgroundColor: "#000",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  blackStripText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  yellowContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandingSection: {
    flex: 1,
  },
  brandingText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  qrContainer: {
    alignItems: "center",
    padding: 8,
    backgroundColor: "white",
    borderRadius: 4,
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  addressSection: {
    flex: 1,
    justifyContent: "center",
    marginVertical: 20,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
  },
  value: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  largeNumberContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  largeNumber: {
    color: "#000",
    fontSize: 72,
    fontWeight: "bold",
  },
  secondaryNumber: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
});
