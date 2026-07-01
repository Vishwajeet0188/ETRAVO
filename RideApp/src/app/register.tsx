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
import { router,Href } from "expo-router";
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

function UserIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="6" r="3" stroke="#6B7DB3" strokeWidth="1.4" />
      <Path d="M2.5 15.5c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="#6B7DB3" strokeWidth="1.4" strokeLinecap="round" />
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

function PhoneIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <Rect x="4" y="1" width="10" height="16" rx="2" stroke="#6B7DB3" strokeWidth="1.4" />
      <Circle cx="9" cy="14" r="0.8" fill="#6B7DB3" />
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

function CheckIcon() {
  return (
    <Svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <Path d="M2.5 7l3 3 6-6" stroke="#00D4B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type Role = "driver" | "passenger";

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("driver");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const isReady =
    name.trim().length >= 2 &&
    email.trim() &&
    phone.trim() &&
    password.length >= 8 &&
    confirm === password &&
    agreed;

  const handleRegister = async () => {
    if (!isReady || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      router.replace(
        (user.role === "driver"
          ? "/(driver)/dashboard"
          : "/(passenger)/dashboard") as Href
      );
    } catch (error) {
      Alert.alert("Registration failed", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Join us and start your journey today</Text>

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
            <Text style={styles.dividerText}>fill in your details</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Full name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}><UserIcon /></View>
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#3A4468"
                style={styles.input}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email address</Text>
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

          {/* Phone */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}><PhoneIcon /></View>
              <TextInput
                placeholder="+91 00000 00000"
                placeholderTextColor="#3A4468"
                style={styles.input}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}><LockIcon /></View>
              <TextInput
                placeholder="Min. 8 characters"
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
            {/* Strength bar */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthSeg,
                      {
                        backgroundColor:
                          password.length >= i * 3
                            ? password.length < 6
                              ? "#E05C5C"
                              : password.length < 10
                              ? "#E0A85C"
                              : "#00D4B8"
                            : "rgba(255,255,255,0.07)",
                      },
                    ]}
                  />
                ))}
                <Text style={styles.strengthText}>
                  {password.length < 6 ? "Weak" : password.length < 10 ? "Fair" : "Strong"}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <View style={[
              styles.inputWrap,
              confirm.length > 0 && confirm === password && styles.inputWrapSuccess,
              confirm.length > 0 && confirm !== password && styles.inputWrapError,
            ]}>
              <View style={styles.inputIcon}><LockIcon /></View>
              <TextInput
                placeholder="Re-enter password"
                placeholderTextColor="#3A4468"
                style={styles.input}
                secureTextEntry={!showConfirm}
                value={confirm}
                onChangeText={setConfirm}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <EyeIcon visible={showConfirm} />
              </TouchableOpacity>
            </View>
            {confirm.length > 0 && confirm !== password && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <CheckIcon />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerBtn, !isReady && styles.registerBtnDimmed]}
            onPress={handleRegister}
            disabled={!isReady || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#080D1A" />
            ) : (
              <Text style={styles.registerBtnText}>Create account</Text>
            )}
          </TouchableOpacity>

          {/* OR divider */}
          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View> */}

          {/* Google */}
          {/* <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity> */}

          {/* Footer */}
          <Text style={styles.footer}>
            Already have an account?{" "}
            <Text style={styles.footerLink} onPress={() => router.push("./login")}>
              Sign in
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
    marginBottom: 13,
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
  inputWrapSuccess: {
    borderColor: "#0EA571",
  },
  inputWrapError: {
    borderColor: "#E05C5C",
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
  errorText: {
    color: "#E05C5C",
    fontSize: 11,
    marginTop: 5,
  },

  // ── Strength bar ──
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
  },
  strengthSeg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthText: {
    color: "#6B7B76",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
    width: 36,
  },

  // ── Terms ──
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#D7DEDC",
    backgroundColor: "#F4F7F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: "rgba(14,165,113,0.12)",
    borderColor: "#0EA571",
  },
  termsText: {
    flex: 1,
    color: "#6B7B76",
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: "#0EA571",
    fontWeight: "500",
  },

  // ── Register button ──
  registerBtn: {
    backgroundColor: "#0EA571",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    marginBottom: 16,
  },
  registerBtnDimmed: {
    opacity: 0.55,
  },
  registerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── Google ──
  // googleBtn: {
  //   paddingVertical: 11,
  //   borderRadius: 9,
  //   alignItems: "center",
  //   borderWidth: 1,
  //   borderColor: "#E4E9E8",
  //   backgroundColor: "#FFFFFF",
  //   marginBottom: 24,
  // },
  // googleBtnText: {
  //   color: "#5B6B66",
  //   fontSize: 13,
  //   fontWeight: "600",
  // },

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