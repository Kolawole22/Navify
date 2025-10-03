import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { H2, TextNormal, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import {
  useBookmarks,
  useUnbookmarkAddress,
  Address,
} from "@/services/addressService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PrimaryButton } from "@/components/Button";
import { LegendList } from "@legendapp/list";
import * as Clipboard from "expo-clipboard";

const AddressItem = React.memo(({ item }: { item: Address }) => {
  const router = useRouter();
  const { mutate: unbookmark, isPending: isUnbookmarking } =
    useUnbookmarkAddress();

  const handlePress = () => {
    console.log("Navigate to details for:", item.hhgCode);
  };

  const handleNavigate = () => {
    console.log("Start navigation for:", item.hhgCode);
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(item.hhgCode);
      Alert.alert("Copied!", "Address code copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy address code");
    }
  };

  const handleUnbookmark = () => {
    unbookmark(item.id);
  };

  return (
    <Pressable onPress={handlePress} style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <TextNormal style={styles.itemLabel}>
          {item.category || "My address"}
        </TextNormal>
        <Body style={styles.itemAddress}>
          {`${item.street || ""}, ${item.city || ""}, ${
            item.stateCode || ""
          }`.replace(/^, |, $/g, "") || "Address details unavailable"}
        </Body>
        <Pressable onPress={handleCopyCode} style={styles.codeContainer}>
          <TextNormal style={styles.itemCode}>{item.hhgCode}</TextNormal>
          <Ionicons name="copy-outline" size={16} color="#6B7280" />
        </Pressable>
      </View>
      <View style={{ alignItems: "center" }}>
        <Pressable
          onPress={handleUnbookmark}
          disabled={isUnbookmarking}
          style={{ marginBottom: 8 }}
        >
          <Ionicons
            name="heart"
            size={28}
            color={isUnbookmarking ? "#ccc" : "#E53935"}
          />
        </Pressable>
        <Pressable onPress={handleNavigate} style={styles.navigateButton}>
          <Ionicons name="navigate-circle-outline" size={32} color="#005C3E" />
        </Pressable>
      </View>
    </Pressable>
  );
});

export default function BookmarkScreen() {
  const { data: addresses, isLoading, error, refetch } = useBookmarks();
  const router = useRouter();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#005C3E" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <TextNormal style={styles.errorText}>
            Error fetching addresses: {error.message}
          </TextNormal>
          <Pressable onPress={() => refetch()} style={styles.retryButton}>
            <TextNormal style={styles.retryText}>Retry</TextNormal>
          </Pressable>
        </View>
      );
    }

    if (!addresses || addresses.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#CBD5E1" />
          <H2 style={styles.emptyTitle}>No Saved Addresses</H2>
          <Body style={styles.emptySubtitle}>
            Addresses you save will appear here.
          </Body>
        </View>
      );
    }

    return (
      <LegendList
        data={addresses}
        renderItem={({ item }) => <AddressItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  const handleAddNew = () => {
    router.push("/(protected)/create-new-address");
  };

  return (
    <SafeAreaContainer edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <H2>Saved Addresses</H2>
        <Pressable onPress={handleAddNew} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={28} color="#005C3E" />
        </Pressable>
      </View>
      {renderContent()}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryText: {
    color: "#374151",
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
  itemContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemLabel: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    color: "#111827",
  },
  itemAddress: {
    color: "#4B5563",
    marginBottom: 4,
  },
  itemCode: {
    color: "#6B7280",
    fontSize: 12,
  },
  navigateButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
  addButton: {
    padding: 4,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
