import React from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  ActivityIndicator,
} from "react-native";
import { TextNormal, Body } from "@/components/Typography";
import { Ionicons } from "@expo/vector-icons";

interface FormInputProps extends TextInputProps {
  label: string;
  helper?: string;
  optional?: boolean;
  error?: string | null;
}

export default function FormInput({
  label,
  helper,
  optional,
  error,
  ...textInputProps
}: FormInputProps) {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <TextNormal className="text-gray-700">
          {label}{" "}
          {optional && <Text className="text-gray-500">(Optional)</Text>}
        </TextNormal>
        {helper && <Body className="text-gray-500">{helper}</Body>}
      </View>
      <View
        className={`border rounded-md overflow-hidden ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <TextInput
          {...textInputProps}
          placeholderTextColor="#9CA3AF"
          className="h-[56px] px-4 text-base text-gray-900"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Convenience export for dropdown style input
interface FormDropdownProps
  extends Omit<FormInputProps, "onChangeText" | "editable" | "multiline"> {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const FormDropdown: React.FC<FormDropdownProps> = ({
  label,
  value,
  placeholder,
  onPress,
  helper,
  optional,
  className,
  isLoading,
  disabled,
  ...props
}) => {
  const containerStyle = disabled ? "bg-gray-100 opacity-60" : "bg-white";
  const textStyle = value ? "text-gray-900" : "text-gray-400";

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <View className="flex-row justify-between items-center mb-1">
          <TextNormal className="font-medium text-gray-700">{label}</TextNormal>
          {optional && (
            <TextNormal className="text-xs text-gray-500">Optional</TextNormal>
          )}
        </View>
      )}
      {helper && (
        <TextNormal className="text-xs text-gray-500 mb-1">{helper}</TextNormal>
      )}
      <Pressable
        onPress={onPress}
        disabled={disabled || isLoading}
        className={`flex-row items-center justify-between border border-gray-300 rounded-md px-4 py-3 ${containerStyle}`}
      >
        <TextNormal className={textStyle}>{value || placeholder}</TextNormal>
        {isLoading ? (
          <ActivityIndicator size="small" color="#6A737D" />
        ) : (
          <Ionicons name="chevron-down" size={20} color="#6A737D" />
        )}
      </Pressable>
    </View>
  );
};

// Convenience export for multi-line input
export function FormTextArea({
  label,
  error,
  ...rest
}: Omit<FormInputProps, "multiline">) {
  return (
    <FormInput
      label={label}
      multiline={true}
      numberOfLines={4}
      error={error}
      {...rest}
    />
  );
}

// Add styles for error text
const styles = StyleSheet.create({
  errorText: {
    color: "#EF4444", // Red color for errors
    marginTop: 4,
    fontSize: 12, // Smaller font size for error
  },
});
