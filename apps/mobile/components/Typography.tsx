import { Text as RNText } from "react-native";
import { TextProps } from "./Themed";
import { cn } from "@/util/cn";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

// Heading 1 (Extra Large)
export function H1({ children, className = "", ...props }: TypographyProps) {
  return (
    <RNText
      className={`font-inter font-semibold text-[28px] leading-[42px] tracking-[0.3px] text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Heading 2 (Large)
export function H2({ children, className = "", ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-heading-large font-inter font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Heading 3 (Medium)
export function H3({ children, className = "", ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-heading-medium font-inter font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Body text
export function Body({ children, className = "", ...props }: TypographyProps) {
  return (
    <RNText
      className={`text-body font-inter font-normal text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Normal text
export function TextNormal({
  children,
  className = "",
  ...props
}: TypographyProps) {
  return (
    <RNText
      className={`text-text font-inter font-normal text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Bold text
export function TextBold({
  children,
  className = "",
  ...props
}: TypographyProps) {
  return (
    <RNText
      className={`text-text font-inter font-semibold text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Button text
export function ButtonText({
  children,
  className = "",
  ...props
}: TypographyProps) {
  return (
    <RNText
      className={cn(
        "text-button font-inter font-bold text-white text-center",
        className
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Default export for convenience
export default {
  H1,
  H2,
  H3,
  Body,
  TextNormal,
  TextBold,
  ButtonText,
};
