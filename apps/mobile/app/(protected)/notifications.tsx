import React, { useState } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LegendList } from "@legendapp/list";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "system" | "address_shared" | "navigation";
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

const NotificationItem = React.memo(({ item }: { item: NotificationItem }) => {
  const router = useRouter();

  const handlePress = () => {
    // Handle notification tap based on type
    switch (item.type) {
      case "address_shared":
        if (item.data?.addressId) {
          router.push(`/(protected)/address-detail?id=${item.data.addressId}`);
        }
        break;
      case "navigation":
        // Handle navigation notification
        break;
      default:
        // Handle system notification
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "address_shared":
        return "share-outline";
      case "navigation":
        return "navigate-outline";
      case "system":
        return "information-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "address_shared":
        return "#3B82F6";
      case "navigation":
        return "#10B981";
      case "system":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInMinutes / 1440);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
    >
      <View style={styles.itemLeft}>
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: getNotificationColor(item.type) },
          ]}
        >
          <Ionicons
            name={
              getNotificationIcon(item.type) as keyof typeof Ionicons.glyphMap
            }
            size={20}
            color="white"
          />
        </View>
        <View style={styles.itemContent}>
          <TextNormal
            style={[styles.notificationTitle, !item.read && styles.unreadText]}
          >
            {item.title}
          </TextNormal>
          <Body style={styles.notificationMessage}>{item.message}</Body>
          <TextNormal style={styles.timestamp}>
            {formatDate(item.createdAt)}
          </TextNormal>
        </View>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Mock data - replace with actual API call
  const mockNotifications: NotificationItem[] = [
    {
      id: "1",
      title: "Address Shared",
      message: "John Doe shared an address with you",
      type: "address_shared",
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      data: { addressId: "123" },
    },
    {
      id: "2",
      title: "Navigation Complete",
      message: "You have reached your destination",
      type: "navigation",
      read: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "System Update",
      message: "New features are available in Navify",
      type: "system",
      read: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredNotifications =
    filter === "all"
      ? mockNotifications
      : mockNotifications.filter((item) => !item.read);

  const unreadCount = mockNotifications.filter((item) => !item.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    // TODO: Call API to mark all as read
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setNotifications([]);
            // TODO: Call API to clear notifications
          },
        },
      ]
    );
  };

  const renderFilterButton = (
    filterType: "all" | "unread",
    label: string,
    count?: number
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
      {count !== undefined && count > 0 && (
        <View
          style={[styles.badge, filter === filterType && styles.badgeActive]}
        >
          <TextNormal
            style={[
              styles.badgeText,
              filter === filterType && styles.badgeTextActive,
            ]}
          >
            {count}
          </TextNormal>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaContainer edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#005C3E" />
        </Pressable>
        <H2 style={styles.title}>Notifications</H2>
        <View style={styles.headerActions}>
          <Pressable onPress={handleMarkAllRead} style={styles.headerButton}>
            <Ionicons name="checkmark-done-outline" size={20} color="#005C3E" />
          </Pressable>
          <Pressable onPress={handleClearAll} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <View style={styles.filters}>
        {renderFilterButton("all", "All", mockNotifications.length)}
        {renderFilterButton("unread", "Unread", unreadCount)}
      </View>

      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#005C3E" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color="#CBD5E1"
          />
          <H2 style={styles.emptyTitle}>No Notifications</H2>
          <Body style={styles.emptySubtitle}>
            {filter === "all"
              ? "You're all caught up!"
              : "No unread notifications."}
          </Body>
        </View>
      ) : (
        <LegendList
          data={filteredNotifications}
          renderItem={({ item }) => <NotificationItem item={item} />}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
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
    flexDirection: "row",
    alignItems: "center",
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
  badge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: "center",
  },
  badgeActive: {
    backgroundColor: "#fff",
  },
  badgeText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  badgeTextActive: {
    color: "#005C3E",
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
  notificationItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unreadItem: {
    backgroundColor: "#FEF3C7",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notificationIcon: {
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
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
});
