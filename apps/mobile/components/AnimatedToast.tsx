import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

interface AnimatedToastProps {
  visible: boolean;
  message: string;
  subMessage?: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onHide?: () => void;
}

const { width } = Dimensions.get("window");

export const AnimatedToast: React.FC<AnimatedToastProps> = ({
  visible,
  message,
  subMessage,
  type = "info",
  duration = 2000,
  onHide,
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(40, { duration: 350 });
      opacity.value = withTiming(1, { duration: 350 });
      // Hide after duration
      setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 350 });
        opacity.value = withTiming(0, { duration: 350 }, (finished) => {
          if (finished && onHide) runOnJS(onHide)();
        });
      }, duration);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  let backgroundColor = "#005C3E";
  if (type === "success") backgroundColor = "#22c55e";
  if (type === "error") backgroundColor = "#ef4444";
  if (type === "info") backgroundColor = "#2563eb";

  return (
    <Animated.View style={[styles.toast, { backgroundColor }, animatedStyle]}>
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    padding: 16,
    marginTop: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  message: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  subMessage: {
    color: "#fff",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
