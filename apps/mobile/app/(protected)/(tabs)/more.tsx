import React, { useState } from "react";
import { View, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUserProfile } from "@/services/authService";
import Button from "@/components/Button";
import { Address, useSavedAddresses } from "@/services/addressService";

export default function MyAddressesScreen() {
  const router = useRouter();
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile();
  const {
    data: addresses,
    isLoading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useSavedAddresses();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "saved" | "recent">(
    "all"
  );

  const handleAddAddress = () => {
    router.push("/(protected)/create-new-address");
  };

  const handleAddressPress = (address: Address) => {
    router.push({
      pathname: "/(protected)/address-detail",
      params: { id: address.id.toString() },
    });
  };

  const handleShareAddress = (address: any) => {
    Alert.alert("Share Address", `Share ${address.hhgCode}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Share",
        onPress: () => {
          // Share functionality would go here
          Alert.alert("Shared", "Address shared successfully!");
        },
      },
    ]);
  };

  const handleDeleteAddress = (address: any) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete ${address.hhgCode}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Delete functionality would go here
            Alert.alert("Deleted", "Address deleted successfully!");
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getAddressDisplayName = (address: any) => {
    if (address.label) return address.label;
    if (address.street) return address.street;
    if (address.landmark) return address.landmark;
    if (address.city) return address.city;
    return "Address";
  };

  const getAddressSubtitle = (address: any) => {
    const parts = [];
    if (address.street && address.street !== address.label)
      parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.estate) parts.push(address.estate);
    return parts.join(", ") || "Location";
  };

  const filteredAddresses =
    addresses?.filter((address) => {
      const matchesSearch =
        searchQuery === "" ||
        address.hhgCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getAddressDisplayName(address)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        getAddressSubtitle(address)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (filterType === "saved") return matchesSearch && address.isSaved;
      if (filterType === "recent")
        return (
          matchesSearch &&
          new Date(address.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
      return matchesSearch;
    }) || [];

  const isLoading = profileLoading || addressesLoading;
  const hasError = profileError || addressesError;

  if (isLoading) {
    return (
      <SafeAreaContainer className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <TextNormal>Loading addresses...</TextNormal>
        </View>
      </SafeAreaContainer>
    );
  }

  if (hasError) {
    return (
      <SafeAreaContainer className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-5">
          <TextNormal>Failed to load addresses</TextNormal>
          <View className="flex-row gap-2 mt-4">
            <Button onPress={() => refetchProfile()} className="flex-1">
              Retry Profile
            </Button>
            <Button onPress={() => refetchAddresses()} className="flex-1">
              Retry Addresses
            </Button>
          </View>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <H2 className="mb-4">My Addresses</H2>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search addresses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          {[
            {
              key: "all",
              label: "All",
              count: addresses?.length || 0,
            },
            {
              key: "saved",
              label: "Saved",
              count: addresses?.filter((a) => a.isSaved).length || 0,
            },
            {
              key: "recent",
              label: "Recent",
              count:
                addresses?.filter(
                  (a) =>
                    new Date(a.createdAt) >
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length || 0,
            },
          ].map((filter) => (
            <Pressable
              key={filter.key}
              className={`flex-1 py-2 px-3 rounded-md ${
                filterType === filter.key ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setFilterType(filter.key as any)}
            >
              <TextNormal
                className={`text-center text-sm ${
                  filterType === filter.key
                    ? "text-[#005C3E] font-medium"
                    : "text-gray-600"
                }`}
              >
                {filter.label} ({filter.count})
              </TextNormal>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Add Address Button */}
        <View className="p-5">
          <Pressable
            onPress={handleAddAddress}
            className="bg-[#005C3E] flex-row items-center gap-2 justify-center py-3 rounded-[10px]"
          >
            <Ionicons name="add" size={20} color="white" className="" />
            <TextNormal className="text-white ml-2">Add New Address</TextNormal>
          </Pressable>
        </View>

        {/* Addresses List */}
        {filteredAddresses.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <TextNormal className="text-gray-500 mt-4 text-center">
              {searchQuery ? "No addresses found" : "No addresses yet"}
            </TextNormal>
            <Body className="text-gray-400 mt-2 text-center">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first address to get started"}
            </Body>
          </View>
        ) : (
          <View className="px-5 pb-5">
            {filteredAddresses.map((address) => (
              <View
                key={address.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              >
                <Pressable onPress={() => handleAddressPress(address)}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="location" size={16} color="#005C3E" />
                        <TextNormal className="text-[#005C3E] font-medium ml-1 text-sm">
                          {address.hhgCode}
                        </TextNormal>
                        {address.isSaved && (
                          <View className="ml-2 bg-yellow-100 px-2 py-1 rounded">
                            <TextNormal className="text-yellow-700 text-xs">
                              Saved
                            </TextNormal>
                          </View>
                        )}
                      </View>

                      <TextNormal className="text-gray-800 font-medium mb-1">
                        {getAddressDisplayName(address)}
                      </TextNormal>

                      <Body className="text-gray-500 mb-2">
                        {getAddressSubtitle(address)}
                      </Body>

                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#999" />
                        <Body className="text-gray-400 text-sm ml-1">
                          Added {formatDate(address.createdAt)}
                        </Body>
                      </View>
                    </View>
                  </View>
                </Pressable>

                {/* Action Buttons */}
                <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                  <Pressable
                    onPress={() => handleAddressPress(address)}
                    className="flex-1 flex-row items-center justify-center py-2"
                  >
                    <Ionicons name="eye-outline" size={16} color="#005C3E" />
                    <TextNormal className="text-[#005C3E] ml-1 text-sm">
                      View
                    </TextNormal>
                  </Pressable>

                  <Pressable
                    onPress={() => handleShareAddress(address)}
                    className="flex-1 flex-row items-center justify-center py-2"
                  >
                    <Ionicons name="share-outline" size={16} color="#005C3E" />
                    <TextNormal className="text-[#005C3E] ml-1 text-sm">
                      Share
                    </TextNormal>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeleteAddress(address)}
                    className="flex-1 flex-row items-center justify-center py-2"
                  >
                    <Ionicons name="trash-outline" size={16} color="#E53935" />
                    <TextNormal className="text-red-500 ml-1 text-sm">
                      Delete
                    </TextNormal>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}
