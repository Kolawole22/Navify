import "react-native-reanimated";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
// import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import Toast from "react-native-toast-message";
// import { Toaster } from "sonner-native";
import { ToastProvider } from "@/components/ToastProvider";
import { KeyboardProvider } from "react-native-keyboard-controller";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000 * 5, // 1 minute
        gcTime: 30 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={colorScheme === "dark" ? DefaultTheme : DefaultTheme}
        >
          <ToastProvider>
            {/* <Toast position="top" /> */}
            {/* <Toaster position="top-center" /> */}

            {/* <StatusBar style="auto" /> */}
            <KeyboardProvider>
              <Stack>
                {/* Protected routes */}
                <Stack.Screen
                  name="(protected)"
                  options={{ headerShown: false }}
                />

                {/* Auth and onboarding routes */}
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="onboarding2"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="login" options={{ headerShown: false }} />

                {/* Account creation flow */}
                <Stack.Screen
                  name="create-account"
                  options={{
                    headerTitle: "Enter your phone number",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="verify-phone"
                  options={{
                    headerTitle: "Verification code",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="personal-info"
                  options={{
                    headerTitle: "Personal information",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="address-info"
                  options={{
                    headerTitle: "Address information",
                    headerShadowVisible: false,
                  }}
                />
              </Stack>
            </KeyboardProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
