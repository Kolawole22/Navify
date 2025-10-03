import React, { useState } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  Alert,
  StyleSheet,
  Share,
  Image,
} from "react-native";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LegendList } from "@legendapp/list";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";

interface SharedAddress {
  id: string;
  shareCode: string;
  shareUrl: string;
  qrCode: string;
  expiresAt: string;
  viewed: boolean;
  createdAt: string;
  address: {
    id: number;
    hhgCode: string;
    street: string;
    city: string;
    stateCode: string;
  };
  sharedWith?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const SharedAddressItem = React.memo(({ item }: { item: SharedAddress }) => {
  const router = useRouter();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this address: ${item.shareUrl}`,
        url: item.shareUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(item.shareUrl);
      Alert.alert("Copied!", "Share link copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy link");
    }
  };

  const handleViewQR = () => {
    // Navigate to QR code view
    router.push({
      pathname: "/(protected)/qr-code",
      params: {
        shareCode: item.shareCode,
        addressId: item.address.id.toString(),
      },
    });
  };

  const handleRevoke = () => {
    Alert.alert(
      "Revoke Share",
      "Are you sure you want to revoke this shared address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => {
            // TODO: Call API to revoke share
            console.log("Revoke share:", item.id);
          },
        },
      ]
    );
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

  const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);

  return (
    <View style={[styles.sharedAddressItem, isExpired && styles.expiredItem]}>
      <View style={styles.itemHeader}>
        <View style={styles.addressInfo}>
          <TextNormal style={styles.addressTitle}>
            {item.address.street || "Address"}
          </TextNormal>
          <Body style={styles.addressDetails}>
            {`${item.address.city}, ${item.address.stateCode}`}
          </Body>
          <TextNormal style={styles.hhgCode}>{item.address.hhgCode}</TextNormal>
        </View>
        <View style={styles.statusContainer}>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <TextNormal style={styles.expiredText}>Expired</TextNormal>
            </View>
          )}
          {item.viewed && !isExpired && (
            <View style={styles.viewedBadge}>
              <TextNormal style={styles.viewedText}>Viewed</TextNormal>
            </View>
          )}
        </View>
      </View>

      <View style={styles.itemActions}>
        <Pressable onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#005C3E" />
          <TextNormal style={styles.actionText}>Share</TextNormal>
        </Pressable>
        <Pressable onPress={handleCopyLink} style={styles.actionButton}>
          <Ionicons name="copy-outline" size={20} color="#005C3E" />
          <TextNormal style={styles.actionText}>Copy Link</TextNormal>
        </Pressable>
        <Pressable onPress={handleViewQR} style={styles.actionButton}>
          <Ionicons name="qr-code-outline" size={20} color="#005C3E" />
          <TextNormal style={styles.actionText}>QR Code</TextNormal>
        </Pressable>
        <Pressable onPress={handleRevoke} style={styles.actionButton}>
          <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
          <TextNormal style={[styles.actionText, styles.revokeText]}>
            Revoke
          </TextNormal>
        </Pressable>
      </View>

      <View style={styles.itemFooter}>
        <TextNormal style={styles.timestamp}>
          Shared {formatDate(item.createdAt)}
        </TextNormal>
        {item.sharedWith && (
          <TextNormal style={styles.sharedWith}>
            with {item.sharedWith.firstName} {item.sharedWith.lastName}
          </TextNormal>
        )}
      </View>
    </View>
  );
});

export default function AddressSharingScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sharedAddresses, setSharedAddresses] = useState<SharedAddress[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  // Mock data - replace with actual API call
  const mockSharedAddresses: SharedAddress[] = [
    {
      id: "1",
      shareCode: "abc123def456",
      shareUrl: "https://navify.app/share/abc123def456",
      qrCode:
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://navify.app/share/abc123def456",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      viewed: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      address: {
        id: 1,
        hhgCode: "NG-LA-001-STR-1234",
        street: "123 Main Street",
        city: "Lagos",
        stateCode: "LA",
      },
      sharedWith: {
        id: "user1",
        firstName: "John",
        lastName: "Doe",
      },
    },
    {
      id: "2",
      shareCode: "xyz789abc123",
      shareUrl: "https://navify.app/share/xyz789abc123",
      qrCode:
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://navify.app/share/xyz789abc123",
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      viewed: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      address: {
        id: 2,
        hhgCode: "NG-AB-002-Z01-5678",
        street: "456 Oak Avenue",
        city: "Abuja",
        stateCode: "AB",
      },
    },
  ];

  const filteredAddresses =
    filter === "all"
      ? mockSharedAddresses
      : mockSharedAddresses.filter((item) => {
          const isExpired =
            item.expiresAt && new Date() > new Date(item.expiresAt);
          return filter === "expired" ? isExpired : !isExpired;
        });

  const activeCount = mockSharedAddresses.filter((item) => {
    const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);
    return !isExpired;
  }).length;

  const expiredCount = mockSharedAddresses.filter((item) => {
    const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);
    return isExpired;
  }).length;

  const renderFilterButton = (
    filterType: "all" | "active" | "expired",
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
        <H2 style={styles.title}>Shared Addresses</H2>
        <Pressable
          onPress={() => router.push("/(protected)/share-address")}
          style={styles.shareButton}
        >
          <Ionicons name="add-circle-outline" size={24} color="#005C3E" />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {renderFilterButton("all", "All", mockSharedAddresses.length)}
        {renderFilterButton("active", "Active", activeCount)}
        {renderFilterButton("expired", "Expired", expiredCount)}
      </View>

      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#005C3E" />
        </View>
      ) : filteredAddresses.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="share-outline" size={64} color="#CBD5E1" />
          <H2 style={styles.emptyTitle}>No Shared Addresses</H2>
          <Body style={styles.emptySubtitle}>
            {filter === "all"
              ? "Addresses you share will appear here."
              : `No ${filter} shared addresses found.`}
          </Body>
        </View>
      ) : (
        <LegendList
          data={filteredAddresses}
          renderItem={({ item }) => <SharedAddressItem item={item} />}
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
  shareButton: {
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
  sharedAddressItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expiredItem: {
    opacity: 0.6,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 2,
  },
  hhgCode: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  expiredBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "600",
  },
  viewedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewedText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "600",
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#005C3E",
    marginTop: 4,
  },
  revokeText: {
    color: "#EF4444",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  timestamp: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  sharedWith: {
    fontSize: 11,
    color: "#6B7280",
  },
  separator: {
    height: 8,
  },
});
