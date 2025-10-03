import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PrimaryButton } from "@/components/Button";
import FormInput from "@/components/FormInput";

export default function ShareAddressScreen() {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [sharedWith, setSharedWith] = useState("");
  const [expiresIn, setExpiresIn] = useState("7");
  const [isLoading, setIsLoading] = useState(false);

  // Mock addresses - replace with actual API call
  const mockAddresses = [
    {
      id: "1",
      hhgCode: "NG-LA-001-STR-1234",
      street: "123 Main Street",
      city: "Lagos",
      stateCode: "LA",
    },
    {
      id: "2",
      hhgCode: "NG-AB-002-Z01-5678",
      street: "456 Oak Avenue",
      city: "Abuja",
      stateCode: "AB",
    },
  ];

  const expirationOptions = [
    { value: "1", label: "1 day" },
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "90", label: "90 days" },
  ];

  const handleShare = async () => {
    if (!selectedAddress) {
      Alert.alert("Error", "Please select an address to share");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to share address
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock API call

      Alert.alert("Success", "Address shared successfully!", [
        {
          text: "View Shared Addresses",
          onPress: () => router.push("/(protected)/address-sharing"),
        },
        {
          text: "OK",
          style: "default",
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to share address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddress(addressId);
  };

  return (
    <SafeAreaContainer edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#005C3E" />
        </Pressable>
        <H2 style={styles.title}>Share Address</H2>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Select Address</H2>
          <Body style={styles.sectionSubtitle}>
            Choose the address you want to share
          </Body>

          {mockAddresses.map((address) => (
            <Pressable
              key={address.id}
              style={[
                styles.addressItem,
                selectedAddress === address.id && styles.selectedAddress,
              ]}
              onPress={() => handleSelectAddress(address.id)}
            >
              <View style={styles.addressInfo}>
                <TextNormal style={styles.addressTitle}>
                  {address.street}
                </TextNormal>
                <Body style={styles.addressDetails}>
                  {address.city}, {address.stateCode}
                </Body>
                <TextNormal style={styles.hhgCode}>
                  {address.hhgCode}
                </TextNormal>
              </View>
              {selectedAddress === address.id && (
                <Ionicons name="checkmark-circle" size={24} color="#005C3E" />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Share Settings</H2>

          <View style={styles.settingItem}>
            <TextNormal style={styles.settingLabel}>
              Share with (optional):
            </TextNormal>
            <FormInput
              label=""
              placeholder="Enter user email or phone"
              value={sharedWith}
              onChangeText={setSharedWith}
              style={styles.input}
            />
            <Body style={styles.settingHelp}>
              Leave empty to create a public share link
            </Body>
          </View>

          <View style={styles.settingItem}>
            <TextNormal style={styles.settingLabel}>Expires in:</TextNormal>
            <View style={styles.expirationOptions}>
              {expirationOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.expirationOption,
                    expiresIn === option.value && styles.selectedExpiration,
                  ]}
                  onPress={() => setExpiresIn(option.value)}
                >
                  <TextNormal
                    style={[
                      styles.expirationText,
                      expiresIn === option.value &&
                        styles.selectedExpirationText,
                    ]}
                  >
                    {option.label}
                  </TextNormal>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Share Options</H2>
          <Body style={styles.sectionSubtitle}>
            Choose how you want to share this address
          </Body>

          <View style={styles.shareOptions}>
            <Pressable style={styles.shareOption}>
              <Ionicons name="qr-code-outline" size={32} color="#005C3E" />
              <TextNormal style={styles.shareOptionText}>QR Code</TextNormal>
            </Pressable>
            <Pressable style={styles.shareOption}>
              <Ionicons name="link-outline" size={32} color="#005C3E" />
              <TextNormal style={styles.shareOptionText}>Share Link</TextNormal>
            </Pressable>
            <Pressable style={styles.shareOption}>
              <Ionicons name="share-outline" size={32} color="#005C3E" />
              <TextNormal style={styles.shareOptionText}>
                Direct Share
              </TextNormal>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          onPress={handleShare}
          disabled={!selectedAddress || isLoading}
          loading={isLoading}
        >
          Share Address
        </PrimaryButton>
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#6B7280",
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAddress: {
    borderColor: "#005C3E",
    backgroundColor: "#F0FDF4",
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 2,
  },
  hhgCode: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
  },
  settingHelp: {
    fontSize: 12,
    color: "#6B7280",
  },
  expirationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expirationOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
  },
  selectedExpiration: {
    borderColor: "#005C3E",
    backgroundColor: "#005C3E",
  },
  expirationText: {
    fontSize: 14,
    color: "#6B7280",
  },
  selectedExpirationText: {
    color: "#fff",
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  shareOption: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    minWidth: 80,
  },
  shareOptionText: {
    marginTop: 8,
    fontSize: 12,
    color: "#005C3E",
    textAlign: "center",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  shareButton: {
    width: "100%",
  },
});
