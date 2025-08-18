import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { TextNormal, H2, Body } from "@/components/Typography";
import { SafeAreaContainer } from "@/components/SafeAreaContainer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";

const { width } = Dimensions.get("window");
const QR_SIZE = Math.min(width * 0.7, 300);

export default function QRCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shareCode = params.shareCode as string;
  const addressId = params.addressId as string;

  const [shareUrl, setShareUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (shareCode) {
      const url = `https://navify.app/share/${shareCode}`;
      setShareUrl(url);
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          url
        )}`
      );
    }
  }, [shareCode]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this address: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert("Copied!", "Share link copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(shareCode);
      Alert.alert("Copied!", "Share code copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy code");
    }
  };

  return (
    <SafeAreaContainer edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#005C3E" />
        </Pressable>
        <H2 style={styles.title}>QR Code</H2>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrContainer}>
          {qrCodeUrl ? (
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrCode}
              contentFit="contain"
            />
          ) : (
            <View style={[styles.qrCode, styles.qrPlaceholder]}>
              <Ionicons name="qr-code-outline" size={64} color="#CBD5E1" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <H2 style={styles.infoTitle}>Share Address</H2>
          <Body style={styles.infoSubtitle}>
            Scan this QR code or share the link to let others access this
            address
          </Body>
        </View>

        <View style={styles.shareCodeContainer}>
          <TextNormal style={styles.shareCodeLabel}>Share Code:</TextNormal>
          <View style={styles.codeContainer}>
            <TextNormal style={styles.shareCode}>{shareCode}</TextNormal>
            <Pressable onPress={handleCopyCode} style={styles.copyButton}>
              <Ionicons name="copy-outline" size={20} color="#005C3E" />
            </Pressable>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#005C3E" />
            <TextNormal style={styles.actionText}>Share</TextNormal>
          </Pressable>
          <Pressable onPress={handleCopyLink} style={styles.actionButton}>
            <Ionicons name="copy-outline" size={24} color="#005C3E" />
            <TextNormal style={styles.actionText}>Copy Link</TextNormal>
          </Pressable>
        </View>
      </View>
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  qrContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  qrCode: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  qrPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  infoTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  infoSubtitle: {
    textAlign: "center",
    color: "#6B7280",
    paddingHorizontal: 20,
  },
  shareCodeContainer: {
    width: "100%",
    marginBottom: 32,
  },
  shareCodeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  shareCode: {
    flex: 1,
    fontSize: 16,
    fontFamily: "monospace",
    color: "#111827",
  },
  copyButton: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  actionButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#005C3E",
    fontWeight: "600",
  },
});
