// apps/mobile/components/SafeAreaContainer.tsx
import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets, Edge } from "react-native-safe-area-context";

export interface SafeAreaContainerProps extends ViewProps {
  /** which sides to apply safe-area padding to */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function SafeAreaContainer({
  children,
  edges = ["top", "bottom"],
  style,
  ...rest
}: SafeAreaContainerProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle: ViewStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  return (
    <View style={[paddingStyle, style]} {...rest}>
      {children}
    </View>
  );
}
