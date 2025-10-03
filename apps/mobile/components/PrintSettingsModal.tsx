import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextNormal, H3 } from "@/components/Typography";
import Button from "@/components/Button";

export interface PrintSettings {
  showBranding: boolean;
  customBranding: string;
  showQRCode: boolean;
  showCoordinates: boolean;
  cardSize: "small" | "medium" | "large";
  orientation: "portrait" | "landscape";
}

interface PrintSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: PrintSettings) => void;
  currentSettings: PrintSettings;
}

const defaultSettings: PrintSettings = {
  showBranding: true,
  customBranding: "Navify",
  showQRCode: true,
  showCoordinates: false,
  cardSize: "medium",
  orientation: "portrait",
};

export default function PrintSettingsModal({
  visible,
  onClose,
  onSave,
  currentSettings,
}: PrintSettingsModalProps) {
  const [settings, setSettings] = useState<PrintSettings>(currentSettings);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const updateSetting = <K extends keyof PrintSettings>(
    key: K,
    value: PrintSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <H3>Print Settings</H3>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Branding Settings */}
          <View style={styles.section}>
            <TextNormal className="text-lg font-semibold mb-3">
              Branding
            </TextNormal>

            <View style={styles.settingRow}>
              <TextNormal>Show Branding</TextNormal>
              <Switch
                value={settings.showBranding}
                onValueChange={(value) => updateSetting("showBranding", value)}
              />
            </View>

            {settings.showBranding && (
              <View style={styles.inputContainer}>
                <TextNormal className="text-gray-600 mb-2">
                  Custom Branding
                </TextNormal>
                <TextInput
                  style={styles.textInput}
                  value={settings.customBranding}
                  onChangeText={(value) =>
                    updateSetting("customBranding", value)
                  }
                  placeholder="Enter your brand name"
                />
              </View>
            )}
          </View>

          {/* Content Settings */}
          <View style={styles.section}>
            <TextNormal className="text-lg font-semibold mb-3">
              Content
            </TextNormal>

            <View style={styles.settingRow}>
              <TextNormal>Show QR Code</TextNormal>
              <Switch
                value={settings.showQRCode}
                onValueChange={(value) => updateSetting("showQRCode", value)}
              />
            </View>

            <View style={styles.settingRow}>
              <TextNormal>Show Coordinates</TextNormal>
              <Switch
                value={settings.showCoordinates}
                onValueChange={(value) =>
                  updateSetting("showCoordinates", value)
                }
              />
            </View>
          </View>

          {/* Layout Settings */}
          <View style={styles.section}>
            <TextNormal className="text-lg font-semibold mb-3">
              Layout
            </TextNormal>

            <View style={styles.settingRow}>
              <TextNormal>Card Size</TextNormal>
              <View style={styles.buttonGroup}>
                {(["small", "medium", "large"] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      settings.cardSize === size && styles.sizeButtonActive,
                    ]}
                    onPress={() => updateSetting("cardSize", size)}
                  >
                    <TextNormal
                      style={[
                        styles.sizeButtonText,
                        settings.cardSize === size &&
                          styles.sizeButtonTextActive,
                      ]}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </TextNormal>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <TextNormal>Orientation</TextNormal>
              <View style={styles.buttonGroup}>
                {(["portrait", "landscape"] as const).map((orientation) => (
                  <TouchableOpacity
                    key={orientation}
                    style={[
                      styles.sizeButton,
                      settings.orientation === orientation &&
                        styles.sizeButtonActive,
                    ]}
                    onPress={() => updateSetting("orientation", orientation)}
                  >
                    <TextNormal
                      style={[
                        styles.sizeButtonText,
                        settings.orientation === orientation &&
                          styles.sizeButtonTextActive,
                      ]}
                    >
                      {orientation.charAt(0).toUpperCase() +
                        orientation.slice(1)}
                    </TextNormal>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={onClose} variant="secondary" className="flex-1 mr-2">
            Cancel
          </Button>
          <Button onPress={handleSave} className="flex-1 ml-2">
            Save Settings
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  inputContainer: {
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#f9f9f9",
  },
  sizeButtonActive: {
    backgroundColor: "#005C3E",
    borderColor: "#005C3E",
  },
  sizeButtonText: {
    color: "#666",
    fontSize: 14,
  },
  sizeButtonTextActive: {
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
});
