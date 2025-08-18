import {
  View,
  TextInput,
  Pressable,
  Image,
  Text,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { H1, TextNormal } from "@/components/Typography";
import { PrimaryButton } from "@/components/Button";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRequestOtp } from "@/services/authService";

export default function CreateAccount() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");

  const { mutate: performRequestOtp, isPending, error } = useRequestOtp();

  const handleCreateAccount = () => {
    if (phoneNumber.trim()) {
      performRequestOtp(
        { phoneNumber: phoneNumber.trim() },
        {
          onSuccess: () => {
            router.push({
              pathname: "/verify-phone",
              params: { phone: phoneNumber.trim() },
            });
          },
          onError: (err) => {
            console.error("Request OTP failed:", err);
          },
        }
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleGoogleSignIn = () => {
    console.log("Google Sign In");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const getErrorMessage = (error: any): string | null => {
    if (!error) return null;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return "An unexpected error occurred requesting OTP.";
  };
  const errorMessage = getErrorMessage(error);

  return (
    <View className="flex-1 bg-white p-6">
      {/* Back Button */}
      {/* <Pressable onPress={handleBack} className="mb-6">
        <Ionicons name="arrow-back" size={24} color="#2D3035" />
      </Pressable>

      <H1 className="mb-8">Enter your phone number</H1> */}

      <TextNormal className="mb-2">Phone or email</TextNormal>

      {/* Phone Input with Flag */}
      <View className="flex-row items-center bg-gray-100 rounded-md p-2 mb-2">
        <View className="mr-2 w-6 h-8">
          {/* Nigerian Flag */}
          <Image
            source={require("@/assets/images/nigerian-logo.png")}
            className="w-full h-full"
          />
        </View>
        <TextInput
          placeholder="Enter your phone number"
          placeholderTextColor={"#6a737d"}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          className="flex-1 text-black font-inter"
        />
      </View>

      {/* Error Message Display */}
      {errorMessage && (
        <View className="my-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <Text className="text-red-700 text-center">{errorMessage}</Text>
        </View>
      )}

      <TextNormal className="mb-8 text-gray-500">
        Verification code will be sent to this number
      </TextNormal>

      {/* Create Account Button */}
      <PrimaryButton
        onPress={handleCreateAccount}
        disabled={!phoneNumber.trim() || isPending}
        className={`mb-8 ${isPending ? "opacity-50" : ""}`}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : "Create account"}
      </PrimaryButton>

      {/* Divider */}
      <View className="flex-row items-center mb-8">
        <View className="flex-1 h-[1px] bg-gray-200"></View>
        <TextNormal className="mx-4 text-gray-500">Or Continue with</TextNormal>
        <View className="flex-1 h-[1px] bg-gray-200"></View>
      </View>

      {/* Google Sign In */}
      <Pressable
        onPress={handleGoogleSignIn}
        className="flex-row items-center justify-center p-4 border border-gray-200 rounded-md mb-8"
      >
        <Image
          source={require("../assets/images/google-logo.png")}
          className="w-5 h-5 mr-4"
        />
        <TextNormal className="text-gray-800 font-semibold">Google</TextNormal>
      </Pressable>

      {/* Sign In Link */}
      <View className="flex-row justify-center">
        <TextNormal className="text-gray-500">
          Already have an account?
        </TextNormal>
        <Pressable onPress={handleSignIn} className="ml-1">
          <TextNormal className="text-gray-900 font-semibold underline">
            Sign in
          </TextNormal>
        </Pressable>
      </View>
    </View>
  );
}
