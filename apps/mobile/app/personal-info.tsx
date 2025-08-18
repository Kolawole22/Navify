import {
  View,
  Pressable,
  ScrollView,
  Text,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { H1, TextNormal } from "@/components/Typography";
import { PrimaryButton } from "@/components/Button";
import FormInput from "@/components/FormInput";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "expo-checkbox";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as z from "zod";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const phoneNumber = typeof phone === "string" ? phone : "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Progress animation
  const progress = useSharedValue(0);

  useEffect(() => {
    // Animate progress from 0 to 0.5 when component mounts
    progress.value = withTiming(0.5, {
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
    if (isFormValid) {
      router.push({
        pathname: "/address-info",
        params: {
          phone: phoneNumber,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTermsPress = () => {
    // Navigate to terms page
    console.log("Navigate to terms");
  };

  const handlePrivacyPress = () => {
    // Navigate to privacy policy
    console.log("Navigate to privacy policy");
  };

  const isFormValid =
    firstName.trim() && lastName.trim() && email.trim() && termsAccepted;

  const handleInputChange = (field: string, value: string) => {
    if (field === "firstName") {
      setFirstName(value);
    } else if (field === "lastName") {
      setLastName(value);
    } else if (field === "email") {
      setEmail(value);
    }
  };

  const handleTermsChange = (value: boolean) => {
    setTermsAccepted(value);
  };

  const handleError = (field: string, error: string) => {
    setErrors({ [field]: error });
  };

  const handleValidation = (field: string, value: string): boolean => {
    if (field === "firstName") {
      if (!value.trim()) {
        handleError(field, "First name is required");
        return false;
      }
    } else if (field === "lastName") {
      if (!value.trim()) {
        handleError(field, "Last name is required");
        return false;
      }
    } else if (field === "email") {
      if (!value.trim()) {
        handleError(field, "Email is required");
        return false;
      }
      if (!z.email().safeParse(value).success) {
        handleError(field, "Invalid email format");
        return false;
      }
    }
    handleError(field, "");
    return true;
  };

  const handleValidationResult = (
    result: z.SafeParseReturnType<any, any>
  ): boolean => {
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err: z.ZodIssue) => {
        if (err.path.length > 0) {
          const field = err.path[0] as keyof Record<string, string>;
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    } else {
      return true;
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Progress indicator - Animated */}
      <View className="h-1 bg-gray-100">
        <Animated.View
          className="h-full bg-primary-dark"
          style={progressAnimatedStyle}
        />
      </View>

      <KeyboardAwareScrollView bottomOffset={62} className="flex-1 p-6">
        {/* Back Button */}
        {/* <Pressable onPress={handleBack} className="mb-6">
          <Ionicons name="arrow-back" size={24} color="#2D3035" />
        </Pressable>

        <H1 className="mb-2">Personal information</H1> */}

        <TextNormal className="text-gray-500 mb-8">
          Enter your personal details
        </TextNormal>

        {/* First Name */}
        <FormInput
          label="First name"
          value={firstName}
          onChangeText={(value) => {
            handleInputChange("firstName", value);
          }}
          placeholder="Enter your first name"
          autoComplete="name-given"
          error={errors["firstName"]}
        />

        {/* Last Name */}
        <FormInput
          label="Last name"
          value={lastName}
          onChangeText={(value) => {
            handleInputChange("lastName", value);
          }}
          placeholder="Enter your last name"
          autoComplete="family-name"
          error={errors["lastName"]}
        />

        {/* Email */}
        <FormInput
          label="Email"
          value={email}
          onChangeText={(value) => {
            handleInputChange("email", value);
          }}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors["email"]}
        />

        {/* Terms Checkbox */}
        <View className="flex-row items-start mb-6">
          <Checkbox
            value={termsAccepted}
            onValueChange={handleTermsChange}
            color={termsAccepted ? "#027A48" : undefined}
            className="h-5 w-5 mt-0.5 mr-2 border border-gray-400 rounded"
          />
          <TextNormal className="flex-1 text-gray-600">
            I Agree to{" "}
            <TextNormal
              className="text-gray-700 underline"
              onPress={handleTermsPress}
            >
              Terms of Service
            </TextNormal>{" "}
            and{" "}
            <TextNormal
              className="text-gray-700 underline"
              onPress={handlePrivacyPress}
            >
              Privacy Policy
            </TextNormal>
          </TextNormal>
        </View>
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
    </View>
  );
}
