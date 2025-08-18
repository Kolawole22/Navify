import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Pressable,
  useWindowDimensions,
  Animated,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TextNormal, H2, H3, Body } from "@/components/Typography";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef(null);
  const { width, height } = useWindowDimensions();

  // Animation for the bottom sheet
  const bottomSheetHeight = useRef(new Animated.Value(200)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract params safely
  const name = typeof params.name === "string" ? params.name : "Destination";
  const destinationLat =
    typeof params.lat === "string" ? parseFloat(params.lat) : 9.082;
  const destinationLng =
    typeof params.lng === "string" ? parseFloat(params.lng) : 8.6753;

  // Current location
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(true);

  // Mock navigation steps
  const [steps, setSteps] = useState([
    {
      id: 1,
      instruction: "Head north on Main Street",
      distance: "0.5 km",
      icon: "arrow-up-outline",
    },
    {
      id: 2,
      instruction: "Turn right onto Oak Avenue",
      distance: "0.8 km",
      icon: "arrow-forward-outline",
    },
    {
      id: 3,
      instruction: "Continue onto Market Road",
      distance: "1.2 km",
      icon: "arrow-forward-outline",
    },
    {
      id: 4,
      instruction: "Your destination will be on the left",
      distance: "0.2 km",
      icon: "location-outline",
    },
  ]);

  // Mock route coordinates (polyline)
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Get current location
  useEffect(() => {
    let locationSubscription;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required for navigation"
        );
        return;
      }

      // Watch position for real-time updates
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (location) => {
          setCurrentLocation(location);

          // Generate a mock route if none exists
          if (routeCoordinates.length === 0) {
            generateMockRoute(location.coords);
          }
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Generate a mock route between current location and destination
  const generateMockRoute = (origin) => {
    // Create a sequence of points between origin and destination
    const pointCount = 10;
    const latDiff = (destinationLat - origin.latitude) / pointCount;
    const lngDiff = (destinationLng - origin.longitude) / pointCount;

    const route = [];
    for (let i = 0; i <= pointCount; i++) {
      // Add some randomness to make it look like a real route
      const jitter =
        i > 0 && i < pointCount ? (Math.random() - 0.5) * 0.001 : 0;

      route.push({
        latitude: origin.latitude + latDiff * i + jitter,
        longitude: origin.longitude + lngDiff * i + jitter,
      });
    }

    setRouteCoordinates(route);
  };

  // Toggle bottom sheet expansion
  const toggleBottomSheet = () => {
    Animated.timing(bottomSheetHeight, {
      toValue: isExpanded ? 200 : 400,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsExpanded(!isExpanded);
  };

  // Center the map on current location
  const centerOnLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005 * (width / height),
        },
        1000
      );
    }
  };

  // Toggle location tracking
  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      centerOnLocation();
    }
  };

  // Initial map region
  const initialRegion = {
    latitude: 9.082,
    longitude: 8.6753,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02 * (width / height),
  };

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Map */}
      <MapView
        ref={mapRef}
        className="w-full h-full"
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        followsUserLocation={isTracking}
      >
        {/* Destination marker */}
        <Marker
          coordinate={{ latitude: destinationLat, longitude: destinationLng }}
        >
          <View className="items-center">
            <View className="w-3 h-3 rounded-full bg-[#E53935]" />
            <View className="bg-[#E53935] px-2 py-1 rounded mt-1">
              <TextNormal className="text-white text-xs font-bold">
                {name}
              </TextNormal>
            </View>
          </View>
        </Marker>

        {/* Route line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#005C3E"
          />
        )}
      </MapView>

      {/* Top navigation bar */}
      <SafeAreaContainer
        edges={["top"]}
        className="absolute top-0 left-0 right-0"
      >
        <View className="flex-row justify-between items-center p-4">
          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#005C3E" />
          </Pressable>

          <View className="bg-white p-2 px-4 rounded-full shadow-sm">
            <TextNormal className="font-bold">Navigating to {name}</TextNormal>
          </View>

          <Pressable
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            onPress={() =>
              Alert.alert("Voice Guidance", "Voice guidance would toggle here")
            }
          >
            <Ionicons name="volume-medium-outline" size={24} color="#005C3E" />
          </Pressable>
        </View>
      </SafeAreaContainer>

      {/* Position controls */}
      <View className="absolute right-4 top-1/3">
        <Pressable
          className={`w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm mb-2 ${
            isTracking ? "bg-[#005C3E]" : "bg-white"
          }`}
          onPress={toggleTracking}
        >
          <Ionicons
            name="navigate"
            size={20}
            color={isTracking ? "white" : "#005C3E"}
          />
        </Pressable>

        <Pressable
          className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          onPress={centerOnLocation}
        >
          <Ionicons name="locate-outline" size={20} color="#005C3E" />
        </Pressable>
      </View>

      {/* Bottom navigation sheet */}
      <Animated.View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg"
        style={{ height: bottomSheetHeight }}
      >
        {/* Handle to expand/collapse */}
        <Pressable onPress={toggleBottomSheet} className="items-center py-2">
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </Pressable>

        {/* Navigation info */}
        <View className="px-5 pt-2 pb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <TextNormal className="text-gray-500">Arriving at</TextNormal>
              <H3>{name}</H3>
            </View>

            <View className="items-end">
              <TextNormal className="text-[#005C3E] font-bold">
                2.7 km
              </TextNormal>
              <TextNormal className="text-gray-500">15 min</TextNormal>
            </View>
          </View>

          {/* Navigation steps */}
          <View>
            {steps.slice(0, isExpanded ? 4 : 1).map((step) => (
              <View
                key={step.id}
                className="flex-row py-3 border-t border-gray-100"
              >
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name={step.icon} size={20} color="#005C3E" />
                </View>
                <View className="flex-1">
                  <TextNormal className="font-bold">
                    {step.instruction}
                  </TextNormal>
                  <TextNormal className="text-gray-500 text-sm">
                    {step.distance}
                  </TextNormal>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
