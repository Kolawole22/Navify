import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ButtonText } from "./Typography";
import { cn } from "@/util/cn";

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "large" | "medium" | "small";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

export default function Button({
  onPress,
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = true,
  className = "",
  textClassName = "",
}: ButtonProps) {
  // Base classes for all buttons
  const baseClasses = "rounded-lg items-center justify-center";

  // Size classes
  const sizeClasses = {
    large: "py-5",
    medium: "py-4",
    small: "py-2 px-4",
  };

  // Variant classes
  const variantClasses = {
    primary: "bg-primary-dark",
    secondary: "bg-gray-100",
  };

  // Disabled classes
  const disabledClasses = disabled ? "opacity-50" : "";

  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";

  // Text color based on variant
  const textColorClasses = {
    primary: "",
    secondary: "text-primary-dark",
  };

  // Combined classes
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${widthClasses} ${className}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={combinedClasses}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#004D33"}
          size="small"
        />
      ) : (
        <ButtonText className={cn(textColorClasses[variant], textClassName)}>
          {children}
        </ButtonText>
      )}
    </Pressable>
  );
}

// Export button variants for convenience
export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}
