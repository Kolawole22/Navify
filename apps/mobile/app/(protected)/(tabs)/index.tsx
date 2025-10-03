import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  FlatList,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { TextNormal, Body, H2 } from "@/components/Typography";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { useAddressSearch, Address } from "@/hooks/useLocations";
import { useDebounce } from "@/hooks/useDebounce";
import { useCurrentUser } from "@/services/authService";
import {
  useBookmarkAddress,
  useUnbookmarkAddress,
  useCreateAddress,
} from "@/services/addressService";
import Button from "@/components/Button";
import * as Clipboard from "expo-clipboard";
import { LegendList } from "@legendapp/list";
// import Toast from "react-native-toast-message";
import { handleError } from "@/lib/axiosInstance";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { useToast } from "@/components/ToastProvider";

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Address | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const debouncedSearchText = useDebounce(searchText, 300);
  const { data: user } = useCurrentUser();
  const { mutate: bookmarkAddress, isPending: isBookmarking } =
    useBookmarkAddress();
  const { mutate: unbookmarkAddress, isPending: isUnbookmarking } =
    useUnbookmarkAddress();
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { showToast } = useToast();

  const {
    data: searchResults,
    isFetching: isSearching,
    isError: isSearchError,
  } = useAddressSearch(debouncedSearchText);

  const { width, height } = useWindowDimensions();
  const ASPECT_RATIO = width / height;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (e) {
        setErrorMsg("Failed to get current location.");
        console.error(e);
      }
    })();
  }, []);

  const initialRegion: Region = {
    latitude: 9.082,
    longitude: 8.6753,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0922 * ASPECT_RATIO,
  };

  const userRegion: Region = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005 * ASPECT_RATIO,
      }
    : initialRegion;

  const handleAddressSelect = useCallback(
    (address: Address) => {
      Keyboard.dismiss();
      setSearchText("");
      setIsSearchFocused(false);
      setSelectedMarker(address);
      setShowBottomSheet(true);

      const region: Region = {
        latitude: parseFloat(address.latitude),
        longitude: parseFloat(address.longitude),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005 * ASPECT_RATIO,
      };
      mapRef.current?.animateToRegion(region, 1000);
    },
    [ASPECT_RATIO]
  );

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedMarker(null);
  };

  const handleCopyAddress = async () => {
    if (selectedMarker) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Clipboard.setStringAsync(selectedMarker.hhgCode);
      // Alert.alert("Copied!", "Address code copied to clipboard");
      showToast({
        message: "Copied!",
        subMessage: "Address code copied to clipboard",
        type: "success",
      });
      // Toast.show({
      //   type: "success",
      //   text1: "Address code copied to clipboard",
      // });
    }
  };

  const handleShareAddress = () => {
    if (selectedMarker) {
      // Share functionality would go here
      Alert.alert("Shared", "Address shared successfully!");
    }
  };

  const openGoogleMaps = () => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker?.latitude},${selectedMarker?.longitude}`
    );
  };

  const handleToggleBookmark = () => {
    if (!selectedMarker) return;

    console.log("selectedMarker", selectedMarker);

    // If already bookmarked, unbookmark it
    if (selectedMarker.isBookmarked) {
      unbookmarkAddress(selectedMarker.id, {
        onSuccess: () => {
          // Update the local state to reflect the change
          setSelectedMarker((prev) =>
            prev ? { ...prev, isBookmarked: false } : null
          );
          showToast({
            message: "Address removed from your bookmarks",
            type: "success",
          });
          // Toast.show({
          //   type: "success",
          //   text1: "Address removed from your bookmarks",
          // });
        },
      });
      return;
    }

    // If not bookmarked, bookmark it
    // Check if the address already has an ID (exists in our database)
    if (selectedMarker.id) {
      // Address exists, just bookmark it
      bookmarkAddress(selectedMarker.id, {
        onSuccess: () => {
          // Update the local state to reflect the change
          setSelectedMarker((prev) =>
            prev ? { ...prev, isBookmarked: true } : null
          );
          showToast({
            message: "Address added to your bookmarks",
            type: "success",
          });
          // Toast.show({
          //   type: "success",
          //   text1: "Address added to your bookmarks",
          // });
        },
      });
    } else {
      // Address doesn't exist in our database, create it first then bookmark
      const addressPayload = {
        latitude: parseFloat(selectedMarker.latitude),
        longitude: parseFloat(selectedMarker.longitude),
        street: selectedMarker.street,
        state: selectedMarker.stateCode,
        lga: selectedMarker.lgaCode,
        city: selectedMarker.city,
        houseNumber: selectedMarker.houseNumber || "",
        landmark: selectedMarker.landmark || "",
        estate: selectedMarker.estate || "",
        specialDescription: selectedMarker.specialDescription || "",
        isSaved: true,
        label: selectedMarker.label || "Saved Address",
      };

      createAddress(addressPayload, {
        onSuccess: (newAddress) => {
          // Now bookmark the newly created address
          bookmarkAddress(newAddress.id, {
            onSuccess: () => {
              // Update the local state to reflect the change
              setSelectedMarker((prev) =>
                prev ? { ...prev, id: newAddress.id, isBookmarked: true } : null
              );
              showToast({
                message: "Address created and added to your bookmarks",
                type: "success",
              });
              // Toast.show({
              //   type: "success",
              //   text1: "Address created and added to your bookmarks",
              // });
            },
            onError: (error) => {
              showToast({
                message: "Address created but failed to bookmark",
                subMessage: error.message,
                type: "error",
              });
              // Toast.show({
              //   type: "error",
              //   text1:
              //     "Address created but failed to bookmark: " + error.message,
              // });
            },
          });
        },
        onError: handleError,
      });
    }
  };

  const renderSearchResult = ({ item }: { item: Address }) => (
    <Pressable
      className="p-3 border-b border-gray-100"
      onPress={() => handleAddressSelect(item)}
    >
      <Body className="font-medium">{item.street}</Body>
      <TextNormal className="text-gray-500 text-xs">
        {item.city}, {item.stateCode}
      </TextNormal>
      <TextNormal className="text-gray-400 text-xs">{item.hhgCode}</TextNormal>
    </Pressable>
  );

  const categories = [
    { id: 1, name: "School", icon: "school-outline" },
    { id: 2, name: "Groceries", icon: "cart-outline" },
    { id: 3, name: "Coffee", icon: "cafe-outline" },
    { id: 4, name: "Restaurant", icon: "restaurant-outline" },
  ];

  const showSearchResults = isSearchFocused && debouncedSearchText.length >= 2;
  const isSaving = isBookmarking || isUnbookmarking || isCreating;

  console.log(searchResults);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        loadingEnabled
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        region={!selectedMarker ? userRegion : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => {
          setIsSearchFocused(false);
          Keyboard.dismiss();
        }}
      >
        {selectedMarker && (
          <Marker
            coordinate={{
              latitude: parseFloat(selectedMarker.latitude),
              longitude: parseFloat(selectedMarker.longitude),
            }}
            title={selectedMarker.street}
            description={selectedMarker.hhgCode}
          />
        )}
      </MapView>

      <View className="absolute top-0 left-0 right-0 px-5">
        <SafeAreaContainer edges={["top"]}>
          <View className="flex-row items-center border-primary bg-white rounded-full my-2.5 px-4 h-12 shadow-sm border">
            <Ionicons name="search" size={22} color="#666" className="mr-2.5" />
            <TextInput
              className="flex-1 text-base text-[#333]"
              placeholder="Search address or HHG code"
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setIsSearchFocused(true)}
              onKeyPress={() => setSelectedMarker(null)}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")} className="p-1">
                <Ionicons name="close-circle" size={20} color="#999" />
              </Pressable>
            )}
            <View className="w-[36px] h-[36px] rounded-full bg-[#005C3E] justify-center items-center ml-2">
              <TextNormal className="text-white text-sm font-bold">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </TextNormal>
            </View>
          </View>

          {showSearchResults && (
            <View className="bg-white rounded-lg shadow-lg mt-1 max-h-60 overflow-hidden border border-gray-200">
              {isSearching && (
                <View className="p-4 items-center">
                  <ActivityIndicator color="#005C3E" />
                  <TextNormal className="text-gray-500 mt-2">
                    Searching...
                  </TextNormal>
                </View>
              )}

              {!isSearching && isSearchError && (
                <View className="p-4 items-center">
                  <TextNormal className="text-red-500">
                    Error fetching results.
                  </TextNormal>
                </View>
              )}
              {!isSearching && searchResults && searchResults.length > 0 && (
                <LegendList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.id.toString()}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <View className="p-4 items-center">
                      <TextNormal className="text-gray-500">
                        No results found.
                      </TextNormal>
                    </View>
                  }
                />
              )}
            </View>
          )}
        </SafeAreaContainer>
      </View>

      <View className="absolute bottom-[100px] left-0 right-0">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 pb-2.5"
        >
          {categories.map((category) => (
            <Pressable
              key={category.id}
              className="flex-row items-center bg-white border border-primary rounded-full mx-[5px] px-[15px] py-[10px] h-[40px] shadow-sm"
              onPress={() => console.log(`Selected ${category.name}`)}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color="#444"
              />
              <TextNormal className="ml-2 text-sm">{category.name}</TextNormal>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={handleCloseBottomSheet}
      >
        <View className="flex-1">
          <Pressable className="flex-1" onPress={handleCloseBottomSheet} />
          <View className="bg-white rounded-t-3xl p-6 pb-8 max-h-[70%]">
            {/* Handle */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

            {/* Address Details */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <H2 className="text-xl font-bold text-gray-800">
                  {selectedMarker?.street || "Address"}
                </H2>
                <Pressable onPress={handleCloseBottomSheet}>
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>

              <View className="bg-gray-50 p-4 rounded-xl mb-4">
                <TextNormal className="text-gray-500 mb-1">
                  Navify Address Code
                </TextNormal>
                <View className="flex-row items-center justify-between">
                  <TextNormal className="text-[#005C3E] font-bold text-lg">
                    {selectedMarker?.hhgCode}
                  </TextNormal>
                  <Pressable
                    onPress={handleCopyAddress}
                    className="flex-row items-center"
                  >
                    <Ionicons name="copy-outline" size={20} color="#005C3E" />
                    <TextNormal className="text-[#005C3E] ml-1">
                      Copy
                    </TextNormal>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={16} color="#666" />
                <TextNormal className="text-gray-600 ml-2">
                  {selectedMarker?.city}, {selectedMarker?.stateCode}
                </TextNormal>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="map-outline" size={16} color="#666" />
                <TextNormal className="text-gray-600 ml-2">
                  {parseFloat(selectedMarker?.latitude || "0").toFixed(6)},{" "}
                  {parseFloat(selectedMarker?.longitude || "0").toFixed(6)}
                </TextNormal>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-y-3">
              <Button onPress={openGoogleMaps} className="bg-[#005C3E]">
                <View className="flex-row items-center justify-center gap-4">
                  <TextNormal className="text-white ml-2">
                    Open in Google Maps
                  </TextNormal>
                  <Ionicons name="navigate-outline" size={20} color="white" />
                </View>
              </Button>

              <View className="flex-row gap-x-3">
                <Pressable
                  onPress={handleShareAddress}
                  className="flex-1 flex-row items-center justify-center py-3 border border-[#005C3E] rounded-xl"
                >
                  <Ionicons name="share-outline" size={20} color="#005C3E" />
                  <TextNormal className="text-[#005C3E] ml-2">Share</TextNormal>
                </Pressable>

                <Pressable
                  onPress={handleToggleBookmark}
                  disabled={isSaving}
                  className={`flex-1 flex-row items-center justify-center py-3 border border-[#005C3E] rounded-xl ${
                    isSaving ? "opacity-50" : ""
                  }`}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#005C3E" />
                  ) : (
                    <Ionicons
                      name={
                        selectedMarker?.isBookmarked
                          ? "bookmark"
                          : "bookmark-outline"
                      }
                      size={20}
                      color="#005C3E"
                    />
                  )}
                  <TextNormal className="text-[#005C3E] ml-2">
                    {isSaving
                      ? selectedMarker?.isBookmarked
                        ? "Unbookmarking..."
                        : "Saving..."
                      : selectedMarker?.isBookmarked
                      ? "Unbookmark"
                      : "Bookmark"}
                  </TextNormal>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
