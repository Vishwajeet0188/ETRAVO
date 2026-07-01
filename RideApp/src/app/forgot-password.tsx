import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const FIELD_WIDTH = 250; // fixed px, not screen-relative
const BASE_URL = "http://localhost:4000/api";

async function requestPasswordReset(email: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to send reset link");
  }
  return res.json();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your registered email address.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not send reset link. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("./login" as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <View style={styles.content}>
        {!sent ? (
          <>
            <Text style={styles.icon}>🔒</Text>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>
              Enter the email address linked to your account and we'll send you a link to reset
              your password.
            </Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="you@example.com"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footer}>
              Remember your password?{" "}
              <Text style={styles.footerLink} onPress={() => router.push("./login" as any)}>
                Sign in
              </Text>
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We've sent a password reset link to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
              {"\n\n"}Please check your inbox and follow the instructions to reset your password.
            </Text>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => router.push("./login" as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Back to Login</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              Didn't get it?{" "}
              <Text style={styles.footerLink} onPress={() => setSent(false)}>
                Resend
              </Text>
            </Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F6" },

  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E9E8",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    height: 38
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  backIcon: {
    fontSize: 22,
    color: "#1A2B25",
    fontWeight: "600",
    paddingBottom: 5,
    marginBottom: 5
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A2B25" },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: "center",
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7B76",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 22,
  },
  emailHighlight: {
    color: "#0EA571",
    fontWeight: "600",
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5B6B66",
    width: FIELD_WIDTH,
    textAlign: "left",
    marginBottom: 6,
  },
  textInput: {
    width: FIELD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1A2B25",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    marginBottom: 18,
    textAlign: "center",
  },

  submitBtn: {
    width: FIELD_WIDTH,
    backgroundColor: "#0EA571",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  footer: {
    marginTop: 18,
    fontSize: 12,
    color: "#6B7B76",
    textAlign: "center",
  },
  footerLink: {
    color: "#0EA571",
    fontWeight: "700",
  },
});