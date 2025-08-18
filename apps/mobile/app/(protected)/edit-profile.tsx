import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { H2, TextNormal } from "@/components/Typography";
import FormInput from "@/components/FormInput";
import Button from "@/components/Button";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/services/authService";

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");

  const { mutate: updateProfile, isPending, error } = useUpdateProfile();

  const handleSave = () => {
    updateProfile(
      { firstName, lastName, email, phoneNumber },
      {
        onSuccess: () => {
          Alert.alert("Success", "Profile updated successfully");
          router.back();
        },
        onError: (err: any) => {
          Alert.alert("Error", err?.message || "Failed to update profile");
        },
      }
    );
  };

  return (
    <SafeAreaContainer edges={["top"]} className="bg-white flex-1">
      <View className="p-4">
        <H2 className="mb-2">Edit Profile</H2>
        <TextNormal className="text-gray-500">
          Update your profile information here.
        </TextNormal>
      </View>
      <View className="p-4">
        <FormInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          autoComplete="name-given"
          className="mb-4"
        />
        <FormInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your last name"
          autoComplete="family-name"
          className="mb-4"
        />
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          autoComplete="email"
          keyboardType="email-address"
          className="mb-4"
        />
        <FormInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter your phone number"
          autoComplete="tel"
          keyboardType="phone-pad"
          className="mb-6"
        />
        <Button
          onPress={handleSave}
          disabled={isPending}
          className="bg-[#005C3E]"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {error && (
          <TextNormal className="text-red-500 mt-4">
            {error instanceof Error
              ? error.message
              : "Failed to update profile"}
          </TextNormal>
        )}
      </View>
    </SafeAreaContainer>
  );
}
