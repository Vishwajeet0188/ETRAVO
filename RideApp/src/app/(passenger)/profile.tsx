import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:4000/api"
    : "http://localhost:4000/api";
import { useAuth } from "../../context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type PassengerProfile = {
  // Personal Info
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  pincode: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Ride Preferences
  preferredVehicleType: string;
  homeAddress: string;
  workAddress: string;

  // Documents / Photo
  profilePhoto: string | null;

  // Payment Details
  upiId: string;
  cardLast4: string;
};

// ── fetch passenger profile ──
// async function fetchPassengerProfile(token: string) {
//   // const response = await fetch("http://localhost:4000/api/profile", {
//   `const response = await fetch(`${BASE_URL}/profile`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   return response.json();
// }

async function fetchPassengerProfile(token: string) {
  const response = await fetch(`${BASE_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

// ── Main Component ──
export default function PassengerProfilePage() {
  const { token, logout } = useAuth();
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const loadProfile = async () => {
    try {
      const data = await fetchPassengerProfile(token || "");
      setProfile(data);
    } catch (error: any) {
      console.log(error);

      Alert.alert("Error", error?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // const response = await fetch("http://localhost:4000/api/profile", {
      const response = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      console.log("Profile Save Status:", response.status);

      const responseText = await response.text();
      console.log(responseText);

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      if (Platform.OS === "web") {
        window.alert("Profile updated successfully!");
      } else {
        Alert.alert("Success", "Profile updated successfully!");
      }

      setEditing(false);
    } catch (error) {
      console.error(error);

      if (Platform.OS === "web") {
        window.alert("Failed to update profile");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    }
  };

  const handlePhotoUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && profile) {
      setUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        setProfile({ ...profile, profilePhoto: result.assets[0].uri });
        setUploading(false);
        Alert.alert("Success", "Profile photo updated!");
      }, 1500);
    }
  };

  const renderProgressBar = () => {
    if (!profile) return null;

    let completed = 0;
    let total = 0;

    // Check personal info
    if (profile.name) completed++;
    if (profile.email) completed++;
    if (profile.phone) completed++;
    if (profile.dateOfBirth) completed++;
    total += 4;

    // Check emergency contact
    if (profile.emergencyContactName) completed++;
    if (profile.emergencyContactPhone) completed++;
    total += 2;

    // Check payment
    if (profile.upiId) completed++;
    total += 1;

    const percentage = (completed / total) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Profile Completion</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(percentage)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const renderSectionHeader = (icon: string, title: string, section: string) => (
    <TouchableOpacity
      style={[
        styles.sectionHeader,
        activeSection === section && styles.sectionHeaderActive,
      ]}
      onPress={() => setActiveSection(section)}
    >
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text
        style={[
          styles.sectionTitle,
          activeSection === section && styles.sectionTitleActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = "default",
    editable: boolean = true
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        keyboardType={keyboardType}
        editable={editing && editable}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(passenger)/dashboardP")}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Passenger Profile</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#DC2626",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
            }}
            onPress={handleLogout}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editButton, editing && styles.saveButton]}
            onPress={() => (editing ? handleUpdateProfile() : setEditing(true))}
          >
            <Text style={styles.editButtonText}>
              {editing ? "Save" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Completion Progress */}
      {renderProgressBar()}

      {/* Profile Photo Section */}
      <View style={styles.profilePhotoSection}>
        <TouchableOpacity
          style={styles.profilePhotoContainer}
          onPress={handlePhotoUpload}
          disabled={!editing || uploading}
        >
          {profile.profilePhoto ? (
            <Image
              source={{ uri: profile.profilePhoto }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoInitials}>
                {(profile.name || "Passenger")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
          )}
          {editing && (
            <View style={styles.editPhotoBadge}>
              <Text style={styles.editPhotoIcon}>📷</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
        {/* <View style={styles.ratingContainer}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>4.8 (58 rides)</Text>
        </View> */}
      </View>

      {/* Navigation Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navTabs}
        contentContainerStyle={styles.navTabsContent}
      >
        {renderSectionHeader("👤", "Personal", "personal")}
        {renderSectionHeader("🚨", "Emergency", "emergency")}
        {renderSectionHeader("📍", "Places", "places")}
        {renderSectionHeader("💳", "Payment", "payment")}
      </ScrollView>

      {/* Personal Information Section */}
      {activeSection === "personal" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Personal Information</Text>

          {renderInputField(
            "Full Name",
            profile.name,
            (text) => setProfile({ ...profile, name: text }),
            "Enter your full name",
            "default",
            editing
          )}

          {renderInputField(
            "Email Address",
            profile.email,
            (text) => setProfile({ ...profile, email: text }),
            "Enter your email",
            "email-address",
            editing
          )}

          {renderInputField(
            "Phone Number",
            profile.phone,
            (text) => setProfile({ ...profile, phone: text }),
            "Enter your phone number",
            "phone-pad",
            editing
          )}

          {renderInputField(
            "Date of Birth",
            profile.dateOfBirth,
            (text) => setProfile({ ...profile, dateOfBirth: text }),
            "YYYY-MM-DD",
            "default",
            editing
          )}

          {renderInputField(
            "Gender",
            profile.gender,
            (text) => setProfile({ ...profile, gender: text }),
            "Enter your gender",
            "default",
            editing
          )}

          {renderInputField(
            "Address",
            profile.address,
            (text) => setProfile({ ...profile, address: text }),
            "Enter your address",
            "default",
            editing
          )}

          <View style={styles.rowContainer}>
            <View style={styles.rowItem}>
              {renderInputField(
                "City",
                profile.city,
                (text) => setProfile({ ...profile, city: text }),
                "City",
                "default",
                editing
              )}
            </View>
            <View style={styles.rowItem}>
              {renderInputField(
                "Pincode",
                profile.pincode,
                (text) => setProfile({ ...profile, pincode: text }),
                "Pincode",
                "numeric",
                editing
              )}
            </View>
          </View>
        </View>
      )}

      {/* Emergency Contact Section */}
      {activeSection === "emergency" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Emergency Contact</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🚨 Trusted Contact</Text>
            <Text style={styles.infoText}>
              This person may be contacted in case of an emergency during a
              ride.
            </Text>

            {renderInputField(
              "Contact Name",
              profile.emergencyContactName,
              (text) =>
                setProfile({ ...profile, emergencyContactName: text }),
              "Enter contact name",
              "default",
              editing
            )}

            {renderInputField(
              "Contact Phone",
              profile.emergencyContactPhone,
              (text) =>
                setProfile({ ...profile, emergencyContactPhone: text }),
              "Enter contact phone number",
              "phone-pad",
              editing
            )}

            {renderInputField(
              "Relationship",
              profile.emergencyContactRelation,
              (text) =>
                setProfile({ ...profile, emergencyContactRelation: text }),
              "e.g., Parent, Spouse, Friend",
              "default",
              editing
            )}
          </View>
        </View>
      )}

      {/* Places & Preferences Section */}
      {activeSection === "places" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Saved Places & Preferences</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📍 Saved Addresses</Text>

            {renderInputField(
              "Home Address",
              profile.homeAddress,
              (text) => setProfile({ ...profile, homeAddress: text }),
              "Enter home address",
              "default",
              editing
            )}

            {renderInputField(
              "Work Address",
              profile.workAddress,
              (text) => setProfile({ ...profile, workAddress: text }),
              "Enter work address",
              "default",
              editing
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🚗 Ride Preference</Text>

            {renderInputField(
              "Preferred Vehicle Type",
              profile.preferredVehicleType,
              (text) =>
                setProfile({ ...profile, preferredVehicleType: text }),
              "e.g., Sedan, SUV, Hatchback",
              "default",
              editing
            )}
          </View>
        </View>
      )}

      {/* Payment Section */}
      {activeSection === "payment" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Payment Details</Text>

          <View style={styles.infoCard}>
            {renderInputField(
              "UPI ID",
              profile.upiId,
              (text) => setProfile({ ...profile, upiId: text }),
              "Enter UPI ID",
              "default",
              editing
            )}

            {renderInputField(
              "Card (last 4 digits)",
              profile.cardLast4,
              (text) => setProfile({ ...profile, cardLast4: text }),
              "e.g., 4242",
              "numeric",
              editing
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🔒 Payment Security</Text>
            <Text style={styles.guidelineText}>
              • Your full card details are never stored on this device
            </Text>
            <Text style={styles.guidelineText}>
              • Payments are processed securely by our payment partner
            </Text>
            <Text style={styles.guidelineText}>
              • You can update your default payment method anytime
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7F6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7B76",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E9E8",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#1A2B25",
    marginBottom: 7
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2B25",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(14,165,113,0.10)",
  },
  saveButton: {
    backgroundColor: "#0EA571",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0EA571",
  },

  // Progress Bar
  progressContainer: {
    margin: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B25",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0EA571",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E4E9E8",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0EA571",
    borderRadius: 4,
  },

  // Profile Photo
  profilePhotoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePhotoContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#0EA571",
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F4F7F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#0EA571",
  },
  profilePhotoInitials: {
    fontSize: 36,
    fontWeight: "700",
    color: "#0EA571",
  },
  editPhotoBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0EA571",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  editPhotoIcon: {
    fontSize: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6B7B76",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingStar: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "500",
  },

  // Navigation Tabs
  navTabs: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  navTabsContent: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  sectionHeaderActive: {
    backgroundColor: "#0EA571",
    borderColor: "#0EA571",
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7B76",
  },
  sectionTitleActive: {
    color: "#FFFFFF",
  },

  // Sections
  section: {
    paddingHorizontal: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 16,
  },

  // Input Fields
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B6B66",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F4F7F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A2B25",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  inputDisabled: {
    opacity: 0.7,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },

  // Cards
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#6B7B76",
    lineHeight: 20,
    marginBottom: 12,
  },
  guidelineText: {
    fontSize: 12,
    color: "#6B7B76",
    marginBottom: 8,
  },

  bottomPadding: {
    height: 30,
  },
});