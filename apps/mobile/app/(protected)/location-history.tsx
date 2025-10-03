import React, { useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PrimaryButton } from "@/components/Button";
import { LegendList } from "@legendapp/list";
import * as Location from "expo-location";

interface LocationHistoryItem {
  id: string;
  latitude: number;
  longitude: number;
  activity: "search" | "navigation" | "visit";
  visitedAt: string;
  metadata?: Record<string, any>;
}

const LocationHistoryItem = React.memo(
  ({ item }: { item: LocationHistoryItem }) => {
    const router = useRouter();

    const handlePress = () => {
      // Navigate to map with this location
      router.push({
        pathname: "/(protected)/(tabs)",
        params: {
          latitude: item.latitude,
          longitude: item.longitude,
          fromHistory: "true",
        },
      });
    };

    const getActivityIcon = (activity: string) => {
      switch (activity) {
        case "search":
          return "search-outline";
        case "navigation":
          return "navigate-outline";
        case "visit":
          return "location-outline";
        default:
          return "location-outline";
      }
    };

    const getActivityColor = (activity: string) => {
      switch (activity) {
        case "search":
          return "#3B82F6";
        case "navigation":
          return "#10B981";
        case "visit":
          return "#F59E0B";
        default:
          return "#6B7280";
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) {
        return "Just now";
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    };

    return (
      <Pressable onPress={handlePress} style={styles.historyItem}>
        <View style={styles.itemLeft}>
          <View
            style={[
              styles.activityIcon,
              { backgroundColor: getActivityColor(item.activity) },
            ]}
          >
            <Ionicons
              name={
                getActivityIcon(item.activity) as keyof typeof Ionicons.glyphMap
              }
              size={20}
              color="white"
            />
          </View>
          <View style={styles.itemContent}>
            <TextNormal style={styles.coordinates}>
              {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
            </TextNormal>
            <Body style={styles.activityText}>
              {item.activity.charAt(0).toUpperCase() + item.activity.slice(1)}
            </Body>
            <TextNormal style={styles.timestamp}>
              {formatDate(item.visitedAt)}
            </TextNormal>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </Pressable>
    );
  }
);

export default function LocationHistoryScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<LocationHistoryItem[]>([]);
  const [filter, setFilter] = useState<
    "all" | "search" | "navigation" | "visit"
  >("all");

  // Mock data - replace with actual API call
  const mockHistoryData: LocationHistoryItem[] = [
    {
      id: "1",
      latitude: 9.082,
      longitude: 8.6753,
      activity: "search",
      visitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      latitude: 6.5244,
      longitude: 3.3792,
      activity: "navigation",
      visitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      latitude: 7.3961,
      longitude: 3.8967,
      activity: "visit",
      visitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredData =
    filter === "all"
      ? mockHistoryData
      : mockHistoryData.filter((item) => item.activity === filter);

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all location history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setHistoryData([]);
            // TODO: Call API to clear history
          },
        },
      ]
    );
  };

  const renderFilterButton = (
    filterType: "all" | "search" | "navigation" | "visit",
    label: string
  ) => (
    <Pressable
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <TextNormal
        style={[
          styles.filterText,
          filter === filterType && styles.filterTextActive,
        ]}
      >
        {label}
      </TextNormal>
    </Pressable>
  );

  return (
    <SafeAreaContainer edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#005C3E" />
        </Pressable>
        <H2 style={styles.title}>Location History</H2>
        <Pressable onPress={handleClearHistory} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {renderFilterButton("all", "All")}
        {renderFilterButton("search", "Searches")}
        {renderFilterButton("navigation", "Navigation")}
        {renderFilterButton("visit", "Visits")}
      </View>

      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#005C3E" />
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="time-outline" size={64} color="#CBD5E1" />
          <H2 style={styles.emptyTitle}>No History</H2>
          <Body style={styles.emptySubtitle}>
            {filter === "all"
              ? "Your location history will appear here."
              : `No ${filter} history found.`}
          </Body>
        </View>
      ) : (
        <LegendList
          data={filteredData}
          renderItem={({ item }) => <LocationHistoryItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  clearButton: {
    padding: 4,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  filterButtonActive: {
    backgroundColor: "#005C3E",
  },
  filterText: {
    fontSize: 14,
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#fff",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#6B7280",
    textAlign: "center",
  },
  listContainer: {
    paddingVertical: 16,
  },
  historyItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  coordinates: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  activityText: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
});
