import {
  View,
  Pressable,
  Image,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Body, H1, TextNormal } from "@/components/Typography";
import { PrimaryButton } from "@/components/Button";
import FormInput, { FormDropdown, FormTextArea } from "@/components/FormInput";
import { useState, useEffect, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import SelectModal, { SelectOption } from "@/components/SelectModal";
import {
  useLocations,
  State as StateType,
  Lga as LgaType,
  AddressCategory,
} from "@/hooks/useLocations";

export default function AddressInfo() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phone, firstName, lastName, email } = params;

  // Form state - Store codes now
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
  const [noStreetAddress, setNoStreetAddress] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [housePhoto, setHousePhoto] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  // --- Fetch location data using the hook ---
  const {
    states,
    lgas,
    isLoadingStates,
    isLoadingLgas,
    isErrorStates,
    isErrorLgas,
    errorStates,
    errorLgas,
    addressCategories,
    isLoadingAddressCategories,
    isErrorAddressCategories,
    errorAddressCategories,
  } = useLocations(stateCode); // Pass stateCode to fetch dependent LGAs
  // console.log("states", states);
  // console.log("lgas", lgas);

  // Modal visibility state
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [lgaModalVisible, setLgaModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Fetch address categories

  // --- Prepare options for SelectModal using useMemo ---
  const stateOptions: SelectOption[] = useMemo(
    () =>
      (states ?? []).map((s: StateType) => ({ label: s.name, value: s.code })),
    [states]
  );

  const lgaOptions: SelectOption[] = useMemo(
    () => (lgas ?? []).map((l: LgaType) => ({ label: l.name, value: l.code })),
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

  // Location fetching useEffect remains the same
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

  // Progress animation
  const progress = useSharedValue(0.5);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const handleContinue = () => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Required",
        "Could not determine your location. Please ensure GPS is enabled and permissions are granted."
      );
      return;
    }

    if (isFormValid) {
      const nextParams = {
        phoneNumber: String(phone),
        firstName: String(firstName),
        lastName: String(lastName),
        email: String(email),
        stateCode: stateCode,
        lgaCode: lgaCode,
        city,
        street: noStreetAddress ? "" : street,
        houseNumber: noStreetAddress ? "" : houseNumber,
        landmark,
        apartment,
        estate,
        specialDescription,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        photoUrls: housePhoto ? JSON.stringify([housePhoto]) : undefined,
        noStreetAddress: noStreetAddress.toString(),
        category,
      };

      router.push({ pathname: "/create-password", params: nextParams });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setHousePhoto(result.assets[0].uri);
    }
  };

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);

  // Handle dropdown selection - update codes and labels
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

  const isFormValid =
    stateCode &&
    lgaCode &&
    city &&
    (noStreetAddress || (street && houseNumber)) &&
    latitude &&
    longitude;

  return (
    <View className="flex-1 bg-white">
      {/* Progress indicator - Animated */}
      <View className="h-1 bg-gray-100">
        <Animated.View
          className="h-full bg-primary-dark"
          style={progressAnimatedStyle}
        />
      </View>

      <KeyboardAwareScrollView bottomOffset={62} className="flex-1 p-6 ">
        {/* Back Button */}
        {/* <Pressable onPress={handleBack} className="mb-6">
        <Ionicons name="arrow-back" size={24} color="#2D3035" />
      </Pressable>

      <H1 className="mb-2">Address information</H1> */}

        <TextNormal className="text-gray-500 mb-8">
          Let's identify your address and assign a code
        </TextNormal>

        {/* Display Location Error if exists */}
        {locationErrorMsg && (
          <View className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
            <Text className="text-yellow-700 text-center">
              Location Status: {locationErrorMsg}
            </Text>
          </View>
        )}

        {/* House Photo */}
        <Pressable
          onPress={pickImage}
          className="border-2 border-dashed border-gray-300 rounded-md p-6 mb-8 items-center justify-center"
        >
          {housePhoto ? (
            <Image
              source={{ uri: housePhoto }}
              className="w-full h-48 rounded-md"
            />
          ) : (
            <>
              <Ionicons name="camera-outline" size={32} color="#6A737D" />
              <TextNormal className="text-gray-500 mt-2 text-center">
                Tap to snap or upload your house photos
              </TextNormal>
            </>
          )}
        </Pressable>

        {/* State */}
        <FormDropdown
          label="State*"
          placeholder="Select State"
          value={stateLabel}
          onPress={() => setStateModalVisible(true)}
          isLoading={isLoadingStates}
        />
        {isErrorStates && (
          <TextNormal className="text-red-500 text-xs mt-1">
            Failed to load states
          </TextNormal>
        )}

        {/* Local Government Area (LGA) */}
        <FormDropdown
          label="LGA*"
          placeholder="Select LGA"
          value={lgaLabel}
          onPress={() => {
            if (!stateCode) {
              Alert.alert("State Required", "Please select a state first.");
              return;
            }
            setLgaModalVisible(true);
          }}
          isLoading={isLoadingLgas}
        />
        {isErrorLgas && stateCode && (
          <TextNormal className="text-red-500 text-xs mt-1">
            Failed to load LGAs for the selected state
          </TextNormal>
        )}

        {/* City/Town */}
        <FormInput
          label="City/Town*"
          placeholder="Enter City or Town"
          value={city}
          onChangeText={setCity}
        />

        {/* No Street Address Toggle */}
        <View className="flex items-start justify-between">
          <TextNormal className="text-gray-700">
            No Street name? Toggle this
          </TextNormal>
          <Switch
            value={noStreetAddress}
            onValueChange={(value) => setNoStreetAddress(value)}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={noStreetAddress ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>

        {/* Street Name */}
        <FormInput
          label="Street Name"
          placeholder="Enter street name"
          value={street}
          onChangeText={setStreet}
          editable={!noStreetAddress}
        />

        {/* House Number */}
        <FormInput
          label="House Number"
          placeholder="Enter house number"
          value={houseNumber}
          onChangeText={setHouseNumber}
          editable={!noStreetAddress}
        />

        {/* Closest Landmark */}
        <FormInput
          label="Landmark"
          placeholder="Nearest landmark"
          value={landmark}
          onChangeText={setLandmark}
        />

        {/* Address Category */}
        <FormDropdown
          label="Address Category"
          placeholder="Select Address Category"
          value={categoryLabel}
          onPress={() => setCategoryModalVisible(true)}
          isLoading={isLoadingAddressCategories}
        />

        <H1 className="mb-6 mt-4">Additional information</H1>

        {/* Apartment/Floor */}
        <FormInput
          label="Apartment/Floor"
          helper="(For multi story buildings)"
          value={apartment}
          onChangeText={setApartment}
          placeholder="Enter here"
          optional
        />

        {/* Name Of Estate/Gated Community */}
        <FormInput
          label="Name Of Estate/Gated Community"
          // helper="(Optional)"
          value={estate}
          onChangeText={setEstate}
          placeholder="Enter here"
          optional
        />

        {/* Special Description */}
        <FormTextArea
          label="Any special description?"
          value={specialDescription}
          onChangeText={setSpecialDescription}
          placeholder="Enter here"
          optional
        />
      </KeyboardAwareScrollView>

      {/* Continue Button */}
      <View className="p-6">
        <PrimaryButton
          onPress={handleContinue}
          disabled={!isFormValid}
          className={!isFormValid ? "bg-gray-300" : ""}
        >
          Continue
        </PrimaryButton>
      </View>

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
        onSelect={handleCategorySelect}
        onClose={() => setCategoryModalVisible(false)}
      />
    </View>
  );
}
