import React, { useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import { H2, TextNormal, Body } from "@/components/Typography";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { useLogin } from "@/services/authService";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.108:3006/api";
  console.warn("base url", BASE_URL);

  const { mutate: performLogin, isPending, error } = useLogin();

  const handleLogin = () => {
    if (email && password) {
      performLogin(
        { email, password },
        {
          onSuccess: () => {
            console.log("Login successful!");
            router.replace("/(protected)/(tabs)");
          },
          onError: (err) => {
            console.error("Login failed:", err);
          },
        }
      );
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password");
  };

  const handleCreateAccount = () => {
    router.push("/create-account");
  };

  const getErrorMessage = (error: any): string | null => {
    if (!error) return null;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return "An unexpected error occurred.";
  };
  const errorMessage = getErrorMessage(error);

  return (
    <SafeAreaContainer edges={["top"]} className="flex-1 bg-white">
      <ScrollView>
        {/* Back button */}
        <Pressable className="p-4" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>

        <View className="px-6 pt-4">
          {/* Header */}
          <H2 className="text-[32px] mb-2">Welcome Back</H2>
          <Body className="text-gray-600 mb-8">
            Let's get you logged in to enjoy easy navigation.
          </Body>

          {/* Email field */}
          <View className="mb-6">
            <TextNormal className="text-gray-700 mb-2">
              Email Address
            </TextNormal>
            <View className="border border-gray-300 rounded-md overflow-hidden">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="youremail@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="h-[56px] px-4 text-base"
              />
            </View>
          </View>

          {/* Password field */}
          <View className="mb-2">
            <TextNormal className="text-gray-700 mb-2">Password</TextNormal>
            <View className="border border-gray-300 rounded-md overflow-hidden flex-row items-center">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••••"
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

          {/* Forgot password */}
          <Pressable
            onPress={handleForgotPassword}
            className="mb-8 self-center"
          >
            <TextNormal className="text-[#005C3E] font-medium">
              I forgot my password
            </TextNormal>
          </Pressable>

          {/* Error Message Display */}
          {errorMessage && (
            <View className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <Text className="text-red-700 text-center">{errorMessage}</Text>
            </View>
          )}

          {/* Login button */}
          <Button
            onPress={handleLogin}
            className={`bg-[#005C3E] mb-8 ${isPending ? "opacity-50" : ""}`}
            disabled={isPending || !email || !password}
          >
            {isPending ? <ActivityIndicator color="#fff" /> : "Login"}
          </Button>

          {/* Face ID section */}
          <View className="items-center mb-16">
            <View className="bg-[#E6F2EE] w-14 h-14 rounded-lg items-center justify-center mb-2">
              <Ionicons name="scan-outline" size={24} color="#005C3E" />
            </View>
          </View>

          {/* Create account section */}
          <View className="flex-row justify-center mb-6">
            <TextNormal className="text-gray-600">
              Don't have an account?{" "}
            </TextNormal>
            <Pressable onPress={handleCreateAccount}>
              <TextNormal className="text-[#005C3E] font-medium underline">
                Sign up
              </TextNormal>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}
