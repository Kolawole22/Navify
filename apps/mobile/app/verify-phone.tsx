import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { H1, Body } from "@/components/Typography";
import { PrimaryButton } from "@/components/Button";
import { useVerifyOtp, useRequestOtp } from "@/services/authService";

const CODE_LENGTH = 6;

export default function VerifyPhone() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const phoneNumber = typeof phone === "string" ? phone : "";

  const [code, setCode] = useState(new Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const {
    mutate: performVerifyOtp,
    isPending: isVerifying,
    error: verifyError,
  } = useVerifyOtp();
  const {
    mutate: performRequestOtp,
    isPending: isRequesting,
    error: requestError,
  } = useRequestOtp();

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleInputChange = (text: string, index: number) => {
    // Handle multi-digit input (e.g., from paste)
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH - index);
      const newCode = [...code];
      digits.split("").forEach((digit, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      // Focus the last input potentially filled by the paste
      const lastFilledIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      if (digits.length > 0) {
        inputsRef.current[lastFilledIndex]?.focus();
      }
      return; // Exit after handling paste-like input
    }

    // Handle single digit or empty input
    if (!/^[0-9]$/.test(text) && text !== "") return;

    const newCodeSingle = [...code];
    newCodeSingle[index] = text;
    setCode(newCodeSingle);

    // Focus next input if a digit was entered
    if (text && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    // Move focus backward on Backspace if current input is empty
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const otp = code.join("");
    if (otp.length === CODE_LENGTH && phoneNumber) {
      performVerifyOtp(
        { phoneNumber, otp },
        {
          onSuccess: () => {
            router.push({
              pathname: "/personal-info",
              params: { phone: phoneNumber },
            });
          },
          onError: (err) => {
            console.error("Verify OTP failed:", err);
          },
        }
      );
    }
  };

  const handleResendCode = () => {
    if (phoneNumber) {
      performRequestOtp(
        { phoneNumber },
        {
          onSuccess: () => {
            console.log("OTP Resent successfully");
          },
          onError: (err) => {
            console.error("Resend OTP failed:", err);
          },
        }
      );
    }
  };

  const isSubmitDisabled = code.some((digit) => digit === "") || isVerifying;

  const getErrorMessage = (error: any): string | null => {
    if (!error) return null;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return "An unexpected error occurred.";
  };
  const errorMessage = getErrorMessage(verifyError || requestError);

  return (
    <View style={styles.container}>
      <H1 style={styles.title}>Verify your phone number</H1>
      <Body style={styles.subtitle}>
        We sent a 6 digit code to {phoneNumber}. Please enter the code below
      </Body>

      <View style={styles.codeInputContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            style={styles.codeInput}
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            textContentType="oneTimeCode"
          />
        ))}
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <PrimaryButton
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
        className={`w-full mb-6 ${
          isSubmitDisabled ? "bg-gray-300 opacity-50" : ""
        }`}
      >
        {isVerifying ? <ActivityIndicator color="#fff" /> : "Verify"}
      </PrimaryButton>

      <Pressable
        onPress={handleResendCode}
        disabled={isRequesting}
        style={styles.resendContainer}
      >
        <Text style={styles.resendText}>
          {isRequesting ? "Sending..." : "I didn't receive code. Resend"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
  },
  title: {
    marginBottom: 16,
  },
  subtitle: {
    color: "#6A737D",
    marginBottom: 32,
    textAlign: "center",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 8,
    width: 48,
    height: 48,
    textAlign: "center",
    fontSize: 20,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#fEE2E2",
    borderRadius: 6,
    width: "100%",
  },
  errorText: {
    color: "#B91C1C",
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: "#D0D5DD",
  },
  resendContainer: {},
  resendText: {
    color: "#005C3E",
    fontWeight: "600",
  },
});
