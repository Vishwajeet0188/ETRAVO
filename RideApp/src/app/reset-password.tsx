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
import { router, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const FIELD_WIDTH = 250; // fixed px, not screen-relative

const BASE_URL = "http://localhost:4000/api";

async function resetPassword(token: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to reset password");
  }
  return res.json();
}

function isStrongEnough(password: string) {
  return password.length >= 6;
}

export default function ResetPassword() {
  // token comes from the reset link, e.g. resetpassword?token=abc123
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in both password fields.");
      return;
    }
    if (!isStrongEnough(password)) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (!token) {
      Alert.alert("Invalid Link", "This reset link is invalid or has expired.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not reset password. Try again.");
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
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <View style={styles.content}>
        {!done ? (
          <>
            <Text style={styles.icon}>🔑</Text>
            <Text style={styles.title}>Create new password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previously used passwords.
            </Text>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
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
                <Text style={styles.submitBtnText}>Reset Password</Text>
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
            <Text style={styles.title}>Password Reset</Text>
            <Text style={styles.subtitle}>
              Your password has been reset successfully.{"\n"}You can now sign in with your new
              password.
            </Text>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => router.push("./login" as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Back to Login</Text>
            </TouchableOpacity>
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
    marginTop: 20
   
  },
  backIcon: {
    fontSize: 22,
    color: "#1A2B25",
    fontWeight: "600",
    marginBottom: 7
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

  passwordRow: {
    width: FIELD_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4E9E8",
    marginBottom: 18,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1A2B25",
    textAlign: "center",
  },
  eyeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  eyeIcon: {
    fontSize: 14,
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