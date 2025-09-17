import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Loading component to show while checking storage
function InitialLoading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Get auth and preferences state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCompletedOnboarding = usePreferencesStore(
    (state) => state.hasCompletedOnboarding
  );

  // Track initialization state
  const [isInitializing, setIsInitializing] = useState(true);

  // Routing logic
  useEffect(() => {
    if (isInitializing) {
      // Wait until we know persisted state is loaded
      return;
    }

    // Determine where to navigate
    const initialPathGroup = segments[0];
    const onProtectedRoute = initialPathGroup === "(protected)";
    const onAuthRoute = initialPathGroup !== "(protected)";
    const onOnboardingRoute = initialPathGroup === "onboarding";

    if (!hasCompletedOnboarding) {
      // First-time user: Show onboarding
      if (!onOnboardingRoute) {
        router.replace("/onboarding");
      }
    } else if (!isAuthenticated) {
      // Onboarding completed but not logged in: Show login
      if (!onAuthRoute && !onOnboardingRoute) {
        router.replace("/login");
      }
    } else {
      // Authenticated user: Go to protected content
      if (!onProtectedRoute) {
        router.replace("/(protected)/(tabs)");
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding, segments, isInitializing]);

  // Effect to track when persisted state has loaded
  useEffect(() => {
    // Small timeout to ensure persist middleware has loaded state
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // While initializing, show a loading indicator
  if (isInitializing) {
    return <InitialLoading />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab navigation */}
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      {/* Modal screens */}
      <Stack.Screen name="modal" options={{ gestureEnabled: false }} />
      {/* Address-related screens */}
      <Stack.Screen
        name="create-address"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="address-detail"
        options={{
          headerShown: true,
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="navigation"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      {/* Settings screens */}
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          headerTitle: "Settings",
          headerShadowVisible: false,
        }}
      />
      on sign up
      {/* Personal Code screens */}
      <Stack.Screen
        name="generate-personal-code"
        options={{
          headerShown: true,
          headerTitle: "Personal Code",
          headerShadowVisible: false,
        }}
      />
      {/* Live Location screens */}
      <Stack.Screen
        name="live-location-sharing"
        options={{
          headerShown: true,
          headerTitle: "Share Live Location",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="live-location-viewer"
        options={{
          headerShown: true,
          headerTitle: "View Live Location",
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="live-location-map"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
