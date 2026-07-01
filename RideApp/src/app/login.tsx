import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";

function BackIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path d="M12.5 15L7.5 10L12.5 5" stroke="#F0F4FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <Rect x="2" y="4" width="14" height="10" rx="2" stroke="#6B7DB3" strokeWidth="1.4" />
      <Path d="M2 6.5l7 4.5 7-4.5" stroke="#6B7DB3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <Path d="M5.5 8V6.5a3.5 3.5 0 017 0V8" stroke="#6B7DB3" strokeWidth="1.4" strokeLinecap="round" />
      <Rect x="3" y="8" width="12" height="8" rx="2" stroke="#6B7DB3" strokeWidth="1.4" />
      <Circle cx="9" cy="12" r="1.2" fill="#6B7DB3" />
    </Svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      {visible ? (
        <>
          <Path d="M1.5 9S4 3.5 9 3.5 16.5 9 16.5 9 14 14.5 9 14.5 1.5 9 1.5 9z" stroke="#6B7DB3" strokeWidth="1.4" />
          <Circle cx="9" cy="9" r="2" stroke="#6B7DB3" strokeWidth="1.4" />
        </>
      ) : (
        <>
          <Path d="M1.5 9S4 3.5 9 3.5 16.5 9 16.5 9 14 14.5 9 14.5 1.5 9 1.5 9z" stroke="#6B7DB3" strokeWidth="1.4" />
          <Path d="M2 2l14 14" stroke="#6B7DB3" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

type Role = "driver" | "passenger";

export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("driver");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({
        email: email.trim(),
        password,
        role,
      });
      router.replace(
        user.role === "driver"
          ? "/(driver)/dashboard"
          : "/(passenger)/dashboardP",
      );
    } catch (error) {
      Alert.alert("Sign in failed", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <BackIcon />
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.card}>

          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandName}>RideApp</Text>
          </View>

          {/* Header */}
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to continue your journey</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {(["driver", "passenger"] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
                onPress={() => setRole(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                  {r === "driver" ? "🚗 Driver" : "🧳 Passenger"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}><MailIcon /></View>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#3A4468"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
              >
                <Text
                  style={{
                    color: "#2563EB",
                    textAlign: "right",
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}><LockIcon /></View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#3A4468"
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.loginBtn, (!email || !password) && styles.loginBtnDimmed]}
            onPress={handleLogin}
            disabled={!email || !password || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#080D1A" />
            ) : (
              <Text style={styles.loginBtnText}>Sign in</Text>
            )}
          </TouchableOpacity>

          {/* OR divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          {/* <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity> */}

          {/* Footer */}
          <Text style={styles.footer}>
            Don't have an account?{" "}
            <Text style={styles.footerLink} onPress={() => router.push("/register")}>
                Sign up
            </Text>
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F7F6",       
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 48,
  },

  back: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },

  // ── Card ──
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 28,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  // ── Brand ──
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 18,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#0EA571",
  },
  brandName: {
    color: "#1A2B25",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  // ── Header ──
  heading: {
    color: "#1A2B25",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subheading: {
    color: "#6B7B76",
    fontSize: 13,
    marginBottom: 22,
  },

  // ── Role ──
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  roleChipActive: {
    backgroundColor: "rgba(14,165,113,0.10)",
    borderColor: "#0EA571",
  },
  roleChipText: {
    color: "#6B7B76",
    fontSize: 12,
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: "#0EA571",
  },

  // ── Divider ──
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4E9E8",
  },
  dividerText: {
    color: "#9AA8A4",
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // ── Form ──
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: "#5B6B66",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#1A2B25",
    fontSize: 13,
    paddingVertical: 11,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  forgot: {
    color: "#0EA571",
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Sign in button ──
  loginBtn: {
    backgroundColor: "#0EA571",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    marginBottom: 16,
  },
  loginBtnDimmed: {
    opacity: 0.55,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── Google ──
  googleBtn: {
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  googleBtnText: {
    color: "#5B6B66",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Footer ──
  footer: {
    color: "#9AA8A4",
    fontSize: 12,
    textAlign: "center",
  },
  footerLink: {
    color: "#0EA571",
    fontWeight: "600",
  },
});