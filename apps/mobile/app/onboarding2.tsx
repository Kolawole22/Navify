import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { H2, TextNormal } from "@/components/Typography";
import Button from "@/components/Button";
import { usePreferencesStore } from "@/store/preferencesStore";

export default function OnboardingAddress() {
  const router = useRouter();
  const setOnboardingComplete = usePreferencesStore(
    (state) => state.setOnboardingComplete
  );

  const handleCreateAccount = () => {
    setOnboardingComplete();
    router.push("/create-account");

    // router.push("/address-info");
  };

  const handleLogin = () => {
    setOnboardingComplete();
    router.push("/login");
  };

  return (
    <View className="flex-1 bg-white">
      {/* Map Container */}
      <View className="flex-1 relative">
        <Image
          source={require("@/assets/images/map-background.png")}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Content at Bottom */}
      <View className="px-8 pt-8 pb-16">
        <H2 className="mb-2">Simplified Address</H2>
        <TextNormal className="mb-4">
          We help you identify locations with ease.
        </TextNormal>

        <Button className="mb-4" onPress={handleCreateAccount}>
          Create Account
        </Button>

        <Button onPress={handleLogin} variant="secondary">
          Login
        </Button>
      </View>
    </View>
  );
}
