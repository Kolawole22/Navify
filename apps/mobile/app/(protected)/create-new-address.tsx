import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Pressable,
  Image,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Body, H2, TextNormal } from "@/components/Typography";
import { PrimaryButton } from "@/components/Button";
import FormInput, { FormDropdown, FormTextArea } from "@/components/FormInput";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import SelectModal, { SelectOption } from "@/components/SelectModal";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { useCreateAddress } from "@/services/addressService";
import { useLocations, AddressCategory } from "@/hooks/useLocations";

// TODO: Get actual Lat/Lon, potentially passed as params
const DEFAULT_LAT = 6.5244;
const DEFAULT_LON = 3.3792;

export default function CreateNewAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // In case lat/lon passed

  const initialLatitude = params.latitude
    ? parseFloat(String(params.latitude))
    : DEFAULT_LAT;
  const initialLongitude = params.longitude
    ? parseFloat(String(params.longitude))
    : DEFAULT_LON;

  // Form state
  const [label, setLabel] = useState(""); // Add label for the new address
  const [stateCode, setStateCode] = useState<string | undefined>(undefined);
  const [stateLabel, setStateLabel] = useState("");
  const [lgaCode, setLgaCode] = useState<string | undefined>(undefined);
  const [lgaLabel, setLgaLabel] = useState("");
  const [city, setCity] = useState("");
  const [cityLabel, setCityLabel] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [apartment, setApartment] = useState("");
  const [estate, setEstate] = useState("");
  const [specialDescription, setSpecialDescription] = useState("");
  const [housePhoto, setHousePhoto] = useState<string | null>(null);
  const [noStreetAddress, setNoStreetAddress] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  // Modal visibility state
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [lgaModalVisible, setLgaModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Use the locations hook to fetch data from API
  const {
    states,
    lgas,
    isLoadingStates,
    isLoadingLgas,
    isErrorStates,
    isErrorLgas,
    addressCategories,
    isLoadingAddressCategories,
    isErrorAddressCategories,
  } = useLocations(stateCode); // Pass stateCode to fetch dependent LGAs

  // Prepare options for SelectModal using useMemo
  const stateOptions: SelectOption[] = useMemo(
    () => (states ?? []).map((s) => ({ label: s.name, value: s.code })),
    [states]
  );

  const lgaOptions: SelectOption[] = useMemo(
    () => (lgas ?? []).map((l) => ({ label: l.name, value: l.code })),
    [lgas]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () =>
      (addressCategories ?? []).map((c: AddressCategory) => ({
        label: c.label,
        value: c.id,
      })),
    [addressCategories]
  );

  // TanStack Query Mutation
  const { mutate: createAddress, isPending, error } = useCreateAddress();

  // Fetch user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationErrorMsg("Permission to access location was denied");
        Alert.alert(
          "Permission Denied",
          "Location access is needed to determine coordinates."
        );
        return;
      }

      try {
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Location request timed out")),
            15000
          )
        );

        const location = (await Promise.race([
          locationPromise,
          timeoutPromise,
        ])) as Location.LocationObject;

        if (location && location.coords) {
          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);
          setLocationErrorMsg(null);
        } else {
          throw new Error("Failed to get location coordinates.");
        }
      } catch (error: any) {
        console.error("Error fetching location:", error);
        setLocationErrorMsg(error.message || "Failed to get current location");
        Alert.alert(
          "Location Error",
          error.message ||
            "Could not fetch your current location. Please ensure GPS is enabled or try again."
        );
      }
    })();
  }, []);

  const handleSaveAddress = () => {
    // Basic validation
    if (
      !stateCode ||
      !lgaCode ||
      !city ||
      (!noStreetAddress && (!street || !houseNumber))
    ) {
      Alert.alert(
        "Missing Information",
        noStreetAddress
          ? "Please fill in State, LGA, and City."
          : "Please fill in State, LGA, City, Street Name, and House Number."
      );
      return;
    }

    const finalLatitude = latitude || initialLatitude;
    const finalLongitude = longitude || initialLongitude;

    const payload = {
      latitude: finalLatitude,
      longitude: finalLongitude,
      label: label.trim(),
      stateCode: stateCode, // Fixed: was "state"
      lgaCode: lgaCode, // Fixed: was "lga"
      city,
      street: noStreetAddress ? "" : street.trim(),
      houseNumber: noStreetAddress ? "" : houseNumber.trim(),
      landmark: landmark.trim() || undefined,
      floor: apartment.trim() || undefined, // Fixed: was "apartment"
      estate: estate.trim() || undefined,
      specialDescription: specialDescription.trim() || undefined,
      // Only send photoUrls if it's a valid URL (not a local file URI)
      photoUrls:
        housePhoto && housePhoto.startsWith("http") ? [housePhoto] : undefined,
      isSaved: true, // Explicitly save when creating this way
      category: category || undefined,
      // Removed noStreetAddress as it's not expected by backend
    };

    createAddress(payload, {
      onSuccess: (newlyCreatedAddress) => {
        console.log("Address created successfully:", newlyCreatedAddress);
        Alert.alert("Success", "Address saved successfully!");
        // Go back to the previous screen (likely the map or address list)
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(protected)/(tabs)/bookmark"); // Fallback
        }
      },
      onError: (err) => {
        console.error("Failed to create address:", err);
        Alert.alert("Error", err.message || "Could not save address.");
      },
    });
  };

  const pickImage = async () => {
    // Request permissions if not already granted
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to grant permission to access photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setHousePhoto(result.assets[0].uri);
    }
  };

  // Dropdown handlers
  const handleStateSelect = (option: SelectOption) => {
    setStateCode(option.value);
    setStateLabel(option.label);
    setStateModalVisible(false);
    setLgaCode(undefined);
    setLgaLabel("");
    setCity("");
    setCityLabel("");
  };

  const handleLgaSelect = (option: SelectOption) => {
    setLgaCode(option.value);
    setLgaLabel(option.label);
    setLgaModalVisible(false);
    setCity("");
    setCityLabel("");
  };

  const handleCitySelect = (option: SelectOption) => {
    setCity(option.value);
    setCityLabel(option.label);
    setCityModalVisible(false);
  };

  const handleCategorySelect = (option: SelectOption) => {
    setCategory(option.value);
    setCategoryLabel(option.label);
    setCategoryModalVisible(false);
  };

  return (
    <SafeAreaContainer
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["bottom", "top"]}
    >
      <Stack.Screen options={{ title: "Add New Address" }} />
      <KeyboardAwareScrollView bottomOffset={62} className="flex-1 p-6">
        {/* Display Location Error if exists */}
        {locationErrorMsg && (
          <View style={styles.locationErrorContainer}>
            <Text style={styles.locationErrorText}>
              Location Status: {locationErrorMsg}
            </Text>
          </View>
        )}

        {/* House Photo */}
        <Pressable onPress={pickImage} style={styles.photoPicker}>
          {housePhoto ? (
            <Image source={{ uri: housePhoto }} style={styles.houseImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color="#6A737D" />
              <TextNormal style={styles.photoPlaceholderText}>
                Tap to add house photo (Optional)
              </TextNormal>
            </View>
          )}
        </Pressable>

        {/* Address Label */}
        <FormInput
          label="Label (e.g. Home, Work)"
          value={label}
          onChangeText={setLabel}
          placeholder="Enter a label for this address"
        />

        {/* State, LGA, City Dropdowns */}
        <FormDropdown
          label="State*"
          value={stateLabel}
          placeholder="Select State"
          onPress={() => setStateModalVisible(true)}
          isLoading={isLoadingStates}
        />
        {isErrorStates && (
          <TextNormal style={styles.errorText}>
            Failed to load states
          </TextNormal>
        )}

        <FormDropdown
          label="Local Government Area (LGA)*"
          value={lgaLabel}
          placeholder="Select LGA"
          onPress={() =>
            stateCode
              ? setLgaModalVisible(true)
              : Alert.alert("Please select a state first")
          }
          isLoading={isLoadingLgas}
        />
        {isErrorLgas && stateCode && (
          <TextNormal style={styles.errorText}>
            Failed to load LGAs for the selected state
          </TextNormal>
        )}

        <FormInput
          label="City/Town*"
          value={city}
          onChangeText={setCity}
          placeholder="Enter city/town"
        />

        {/* No Street Address Toggle */}
        <View style={styles.toggleContainer}>
          <TextNormal style={styles.toggleLabel}>
            No Street name? Toggle this
          </TextNormal>
          <Switch
            value={noStreetAddress}
            onValueChange={(value) => setNoStreetAddress(value)}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={noStreetAddress ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        {/* Street Name, House Number, Landmark Inputs */}
        <FormInput
          label="Street Name"
          value={street}
          onChangeText={setStreet}
          placeholder="Enter street name"
          editable={!noStreetAddress}
        />
        <FormInput
          label="House Number"
          value={houseNumber}
          onChangeText={setHouseNumber}
          placeholder="Enter house number"
          editable={!noStreetAddress}
        />
        <FormInput
          label="Closest Landmark"
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Enter closest landmark"
        />

        {/* Address Category */}
        <FormDropdown
          label="Address Category"
          placeholder="Select Address Category"
          value={categoryLabel}
          onPress={() => setCategoryModalVisible(true)}
          isLoading={isLoadingAddressCategories}
        />
        {isErrorAddressCategories && (
          <TextNormal style={styles.errorText}>
            Failed to load address categories
          </TextNormal>
        )}

        <H2 style={styles.sectionTitle}>Additional information</H2>

        {/* Apartment/Floor, Estate, Special Description Inputs */}
        <FormInput
          label="Apartment/Floor"
          helper="(For multi story buildings)"
          value={apartment}
          onChangeText={setApartment}
          placeholder="Enter here"
          optional
        />
        <FormInput
          label="Name Of Estate/Gated Community"
          helper="(Optional)"
          value={estate}
          onChangeText={setEstate}
          placeholder="Enter here"
          optional
        />
        <FormTextArea
          label="Any special description?"
          value={specialDescription}
          onChangeText={setSpecialDescription}
          placeholder="Enter here"
          optional
        />

        {/* API Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error.message || "Failed to save address"}
            </Text>
          </View>
        )}

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            onPress={handleSaveAddress}
            disabled={isPending}
            className={isPending ? "bg-gray-300" : ""}
          >
            {isPending ? <ActivityIndicator color="#fff" /> : "Save Address"}
          </PrimaryButton>
        </View>
      </KeyboardAwareScrollView>

      {/* Selection Modals */}
      <SelectModal
        searchable
        visible={stateModalVisible}
        title="Select State"
        options={stateOptions}
        isLoading={isLoadingStates}
        onSelect={handleStateSelect}
        onClose={() => setStateModalVisible(false)}
      />
      <SelectModal
        visible={lgaModalVisible}
        title="Select Local Government Area"
        options={lgaOptions}
        isLoading={isLoadingLgas}
        onSelect={handleLgaSelect}
        onClose={() => setLgaModalVisible(false)}
      />
      <SelectModal
        visible={cityModalVisible}
        title="Select City/Town"
        options={[]}
        onSelect={handleCitySelect}
        onClose={() => setCityModalVisible(false)}
      />
      <SelectModal
        visible={categoryModalVisible}
        title="Select Address Category"
        options={categoryOptions}
        isLoading={isLoadingAddressCategories}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryModalVisible(false)}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 24,
  },
  photoPicker: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D0D5DD",
    borderRadius: 8,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "#F9FAFB",
  },
  houseImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  photoPlaceholder: {
    alignItems: "center",
  },
  photoPlaceholderText: {
    color: "#6A737D",
    marginTop: 8,
    textAlign: "center",
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 12,
  },
  errorContainer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fEE2E2",
    borderRadius: 6,
  },
  errorText: {
    color: "#B91C1C",
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 24, // Add some space before the button
    marginBottom: 36,
  },
  coordText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 16,
    fontSize: 12,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  toggleLabel: {
    color: "#374151",
  },
  locationErrorContainer: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 6,
  },
  locationErrorText: {
    color: "#B45309",
    textAlign: "center",
  },
});
