import React, { useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Text,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { H1, TextNormal, Body } from "@/components/Typography";
import { PrimaryButton } from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { useRegister } from "@/services/authService";
import FormInput from "@/components/FormInput"; // Assuming FormInput handles label/input nicely

export default function CreatePasswordScreen() {
  const router = useRouter();
  // Get all the data passed from previous screens
  const params = useLocalSearchParams();

  // Add debug logging to see what we're receiving
  console.log("Received params:", params);

  const {
    phoneNumber,
    firstName,
    lastName,
    email,
    stateCode,
    lgaCode,
    city,
    street,
    houseNumber,
    landmark,
    apartment,
    estate,
    specialDescription,
    category,
    photoUrls, // Assuming this is passed as stringified JSON or similar
    latitude,
    longitude,
    noStreetAddress,
  } = params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { mutate: registerUser, isPending, error: apiError } = useRegister();

  const handleContinue = () => {
    setPasswordError(null);

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // Check for missing required fields and log which ones are missing
    const requiredFields = {
      phoneNumber,
      firstName,
      lastName,
      email,
      stateCode,
      lgaCode,
      city,
      // Only require street if noStreetAddress is not true
      ...(noStreetAddress !== "true" && { street }),
      latitude,
      longitude,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error("Missing registration data:", missingFields);
      console.error("All received params:", params);
      setPasswordError(
        `Missing required information: ${missingFields.join(
          ", "
        )}. Please go back and complete all steps.`
      );
      return;
    }

    const registrationData = {
      phoneNumber: String(phoneNumber),
      firstName: String(firstName),
      lastName: String(lastName),
      email: String(email),
      password: password,
      stateCode: String(stateCode),
      lgaCode: String(lgaCode),
      city: String(city),
      street: street ? String(street) : "",
      houseNumber: houseNumber ? String(houseNumber) : "",
      landmark: landmark ? String(landmark) : undefined,
      apartment: apartment ? String(apartment) : undefined,
      estate: estate ? String(estate) : undefined,
      specialDescription: specialDescription
        ? String(specialDescription)
        : undefined,
      category: category ? String(category) : undefined,
      photoUrls: photoUrls ? JSON.parse(String(photoUrls)) : undefined,
      latitude: parseFloat(String(latitude)),
      longitude: parseFloat(String(longitude)),
      noStreetAddress: noStreetAddress === "true",
    };

    console.log("--- Registration Request Body ---");
    console.log(registrationData);
    console.log("---------------------------------");

    registerUser(registrationData, {
      onSuccess: () => {
        // Navigation is handled by root layout watching auth state
        console.log("Registration successful!");
        router.replace("/login");
      },
      onError: (err) => {
        console.error("Registration failed:", err);
        // Error state is available via 'error' from useRegister
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  // Extract error message (distinguish API error from local password error)
  const getErrorMessage = (error: any): string | null => {
    if (!error) return null;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return "An unexpected registration error occurred.";
  };
  const networkErrorMessage = getErrorMessage(apiError);

  return (
    <SafeAreaContainer edges={["top"]} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Back button */}
        {/* <Pressable className="p-4" onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable> */}

        <View className="p-6 flex-1">
          <H1 className="mb-2">Choose password</H1>
          <Body className="text-gray-500 mb-8">
            Passwords must be at least 6 characters long
          </Body>

          {/* Password Input */}
          <View className="mb-6">
            <View className="border border-gray-300 rounded-md overflow-hidden flex-row items-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
                autoComplete="password-new"
                className="flex-1 h-[56px] px-4 text-base"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#005C3E"
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-1">
            <View className="border border-gray-300 rounded-md overflow-hidden flex-row items-center">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm Password"
                autoComplete="password-new"
                className="flex-1 h-[56px] px-4 text-base"
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="px-4"
              >
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#005C3E"
                />
              </Pressable>
            </View>
          </View>

          {/* Display Password Match / Length Error */}
          {passwordError && (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 12,
                marginTop: 4,
                marginBottom: 16,
              }}
            >
              {passwordError}
            </Text>
          )}

          {/* Display API Error Message */}
          {networkErrorMessage && (
            <View className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <Text className="text-red-700 text-center">
                {networkErrorMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Continue Button Area */}
        <View className="p-6 border-t border-gray-100">
          <PrimaryButton
            onPress={handleContinue}
            disabled={
              isPending || !password || !confirmPassword || password.length < 6
            }
            className={
              isPending || !password || !confirmPassword || password.length < 6
                ? "bg-gray-300"
                : ""
            }
          >
            {isPending ? <ActivityIndicator color="#fff" /> : "Continue"}
          </PrimaryButton>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}
