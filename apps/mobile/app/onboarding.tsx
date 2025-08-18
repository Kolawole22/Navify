import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Body, ButtonText, H2 } from "@/components/Typography";
import Button from "@/components/Button";

export default function Onboarding() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/onboarding2");
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-primary/95 justify-center items-center p-8">
      <View className="bg-white rounded-2xl w-full p-6 max-w-[480px] relative">
        {/* <Pressable
          className="absolute top-4 right-4 z-10"
          onPress={handleClose}
        >
          <Text className="text-3xl text-gray-700">×</Text>
        </Pressable> */}

        <H2>Why should I use Navify?</H2>

        <View className="flex-row mb-6">
          <View className="py-2 px-4 bg-[#EAE7FF] rounded-2xl">
            <Text className="text-gray-800 font-semibold">Benefits</Text>
          </View>
          <View className="flex-1 h-[1px] bg-gray-200 self-center ml-4" />
        </View>

        <View className="mb-8">
          <View className="flex-row mb-5 items-start">
            <Text className="text-primary text-lg font-bold mr-3 mt-0.5">
              ✓
            </Text>
            <Body>Find and verify your address using existing location</Body>
          </View>

          <View className="flex-row mb-5 items-start">
            <Text className="text-primary text-lg font-bold mr-3 mt-0.5">
              ✓
            </Text>
            <Body>Get your unique digital code for easy sharing</Body>
          </View>

          <View className="flex-row mb-5 items-start">
            <Text className="text-[#27AE60] text-lg font-bold mr-3 mt-0.5">
              ✓
            </Text>
            <Body>Seamless navigation with maps and delivery services.</Body>
          </View>
        </View>

        <Button onPress={handleContinue}>Continue</Button>
      </View>
    </View>
  );
}
