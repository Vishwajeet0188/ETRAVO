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
  Switch,
  Alert,
  Modal,
  Image,
  Linking,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';


const { width, height } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type DriverProfile = {
  // Personal Info
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pincode: string;
  
  // Professional Info
  driverLicenseNumber: string;
  licenseExpiryDate: string;
  experience: string;
  
  // Vehicle Info
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleYear: string;
  seatingCapacity: string;
  
  // Documents
  profilePhoto: string | null;
  licensePhoto: string | null;
  vehicleRCPhoto: string | null;
  insurancePhoto: string | null;
  
  // Bank Details
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
};

// ──  fetch driver profile ──
async function fetchDriverProfile(token:string){
  // const response = await fetch("http://localhost:4000/api/profile",
     const response = await fetch(`${BASE_URL}/profile`, 
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  return response.json();
}

// ── Main Component ──
export default function DriverProfilePage() {
   const { token, logout } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [uploading, setUploading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

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
      const data = await fetchDriverProfile(token || "");
      setProfile(data);
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // console.log("TOKEN =", token);
      // const response = await fetch( "http://localhost:4000/api/profile",
         const response = await fetch(`${BASE_URL}/profile`, 
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profile),
        }
      );

      console.log("Profile Save Status:", response.status);

      const responseText = await response.text();

      console.log(responseText);

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  if (Platform.OS === "web") {
      window.alert("Profile updated successfully!");
  } else {
      Alert.alert(
        "Success",
        "Profile updated successfully!"
      );
    }
    } catch (error) {
      console.error(error);

      if (Platform.OS === "web") {
        window.alert("Failed to update profile");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    }
  };

  // const handleDocumentUpload = async (documentType: string) => {
  //   const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
  //   if (!permissionResult.granted) {
  //     Alert.alert("Permission Required", "Please allow access to your photo library");
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 1,
  //   });

  //   if (!result.canceled && profile) {
  //     setUploading(true);
  //     // Simulate upload delay
  //     setTimeout(() => {
  //       const updatedProfile = { ...profile };
  //       switch (documentType) {
  //         case "profile":
  //           updatedProfile.profilePhoto = result.assets[0].uri;
  //           break;
  //         case "license":
  //           updatedProfile.licensePhoto = result.assets[0].uri;
  //           break;
  //         case "rc":
  //           updatedProfile.vehicleRCPhoto = result.assets[0].uri;
  //           break;
  //         case "insurance":
  //           updatedProfile.insurancePhoto = result.assets[0].uri;
  //           break;
  //       }
  //       setProfile(updatedProfile);
  //       setUploading(false);
  //       Alert.alert("Success", `${documentType} uploaded successfully!`);
  //     }, 1500);
  //   }
  // };

  const handleDocumentUpload = async (documentType: string) => {
    if (documentType !== "profile") return; // license/rc/insurance now use text links, not image picker

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && profile) {
      setUploading(true);
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
    total += 3;
    
    // Check documents
    if (profile.licensePhoto) completed++;
    if (profile.vehicleRCPhoto) completed++;
    if (profile.insurancePhoto) completed++;
    total += 3;
    
    // Check vehicle info
    if (profile.vehicleNumber) completed++;
    if (profile.vehicleModel) completed++;
    total += 2;
    
    const percentage = (completed / total) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Profile Completion</Text>
          <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const renderSectionHeader = (icon: string, title: string, section: string) => (
    <TouchableOpacity 
      style={[styles.sectionHeader, activeSection === section && styles.sectionHeaderActive]}
      onPress={() => setActiveSection(section)}
    >
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={[styles.sectionTitle, activeSection === section && styles.sectionTitleActive]}>
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

  // const renderDocumentCard = (
  //   title: string,
  //   documentType: string,
  //   photoUri: string | null,
  //   required: boolean = true
  // ) => (
  //   <View style={styles.documentCard}>
  //     <View style={styles.documentHeader}>
  //       <Text style={styles.documentTitle}>{title}</Text>
  //       {required && <Text style={styles.requiredBadge}>Required</Text>}
  //     </View>
  //     <TouchableOpacity
  //       style={styles.documentUploadArea}
  //       onPress={() => handleDocumentUpload(documentType)}
  //       disabled={uploading}
  //     >
  //       {photoUri ? (
  //         <Image source={{ uri: photoUri }} style={styles.documentPreview} />
  //       ) : (
  //         <View style={styles.uploadPlaceholder}>
  //           <Text style={styles.uploadIcon}>📄</Text>
  //           <Text style={styles.uploadText}>Tap to upload</Text>
  //           <Text style={styles.uploadSubtext}>JPG, PNG up to 5MB</Text>
  //         </View>
  //       )}
  //     </TouchableOpacity>
  //   </View>
  // );

  const renderDocumentCard = (
  title: string,
  documentType: string,
  linkValue: string | null,
  onChangeLink: (text: string) => void,
  required: boolean = true
) => (
  <View style={styles.documentCard}>
    <View style={styles.documentHeader}>
      <Text style={styles.documentTitle}>{title}</Text>
      {required && <Text style={styles.requiredBadge}>Required</Text>}
    </View>
    <Text style={styles.inputLabel}>Drive Link</Text>
    <TextInput
      style={styles.input}
      value={linkValue || ""}
      onChangeText={onChangeLink}
      placeholder="Paste Google Drive link here"
      placeholderTextColor="#9AA8A4"
      autoCapitalize="none"
      keyboardType="url"
      editable={editing}
    />
    {/* {linkValue ? (
      <TouchableOpacity
        style={styles.openLinkBtn}
        onPress={() => Linking.openURL(linkValue)}
      >
        <Text style={styles.openLinkText}>🔗 Open Document</Text>
      </TouchableOpacity>
    ) : null} */}
    {linkValue ? (
      <TouchableOpacity
        style={styles.openLinkBtn}
        onPress={() => {
          if (linkValue.startsWith("http://") || linkValue.startsWith("https://")) {
            Linking.openURL(linkValue);
          } else {
            Alert.alert("Invalid Link", "Please enter a valid URL starting with http:// or https://");
          }
        }}
      >
        <Text style={styles.openLinkText}>🔗 Open Document</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA571" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) return null;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
  <TouchableOpacity
    onPress={() => router.replace("/(driver)/dashboard")}
    style={styles.backButton}
  >
    <Text style={styles.backIcon}>←</Text>
  </TouchableOpacity>

  <Text style={styles.headerTitle}>Driver Profile</Text>

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
      <Text style={{ color: "#fff", fontWeight: "600" }}>
        Logout
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.editButton,
        editing && styles.saveButton,
      ]}
      onPress={() =>
        editing
          ? handleUpdateProfile()
          : setEditing(true)
      }
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
          onPress={() => handleDocumentUpload("profile")}
          disabled={!editing}
        >
          {profile.profilePhoto ? (
            <Image source={{ uri: profile.profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoInitials}>
                {(profile.name || "Driver")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                }
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
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>4.9 (342 trips)</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.navTabs}
        contentContainerStyle={styles.navTabsContent}
      >
        {renderSectionHeader("👤", "Personal", "personal")}
        {renderSectionHeader("🚗", "Vehicle", "vehicle")}
        {renderSectionHeader("📄", "Documents", "documents")}
        {renderSectionHeader("🏦", "Bank", "bank")}
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

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📋 License Information</Text>
            {renderInputField(
              "License Number",
              profile.driverLicenseNumber,
              (text) => setProfile({ ...profile, driverLicenseNumber: text }),
              "Enter license number",
              "default",
              editing
            )}
            
            {renderInputField(
              "License Expiry Date",
              profile.licenseExpiryDate,
              (text) => setProfile({ ...profile, licenseExpiryDate: text }),
              "YYYY-MM-DD",
              "default",
              editing
            )}
            
            {renderInputField(
              "Driving Experience",
              profile.experience,
              (text) => setProfile({ ...profile, experience: text }),
              "e.g., 5 years",
              "default",
              editing
            )}
          </View>
        </View>
      )}

      {/* Vehicle Information Section */}
      {activeSection === "vehicle" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Vehicle Information</Text>
          
          <View style={styles.vehicleCard}>
            {renderInputField(
              "Vehicle Number",
              profile.vehicleNumber,
              (text) => setProfile({ ...profile, vehicleNumber: text }),
              "Enter vehicle number",
              "default",
              editing
            )}
            
            {renderInputField(
              "Vehicle Model",
              profile.vehicleModel,
              (text) => setProfile({ ...profile, vehicleModel: text }),
              "e.g., Toyota Innova",
              "default",
              editing
            )}
            
            <View style={styles.rowContainer}>
              <View style={styles.rowItem}>
                {renderInputField(
                  "Color",
                  profile.vehicleColor,
                  (text) => setProfile({ ...profile, vehicleColor: text }),
                  "Color",
                  "default",
                  editing
                )}
              </View>
              <View style={styles.rowItem}>
                {renderInputField(
                  "Year",
                  profile.vehicleYear,
                  (text) => setProfile({ ...profile, vehicleYear: text }),
                  "Year",
                  "numeric",
                  editing
                )}
              </View>
            </View>
            
            {renderInputField(
              "Seating Capacity",
              profile.seatingCapacity,
              (text) => setProfile({ ...profile, seatingCapacity: text }),
              "Number of seats",
              "numeric",
              editing
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🎫 Vehicle Documents</Text>
            <Text style={styles.infoText}>
              Please keep your vehicle documents up to date. You'll need to upload:
            </Text>
            <View style={styles.documentList}>
              <Text style={styles.documentListItem}>✓ Registration Certificate (RC)</Text>
              <Text style={styles.documentListItem}>✓ Insurance Papers</Text>
              <Text style={styles.documentListItem}>✓ Pollution Certificate</Text>
              <Text style={styles.documentListItem}>✓ Fitness Certificate</Text>
            </View>
          </View>
        </View>
      )}

      {/* Documents Section */}
      {/* {activeSection === "documents" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Upload Documents</Text>
          
          {renderDocumentCard("Driver License", "license", profile.licensePhoto, true)}
          {renderDocumentCard("Vehicle RC", "rc", profile.vehicleRCPhoto, true)}
          {renderDocumentCard("Insurance", "insurance", profile.insurancePhoto, true)}
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📌 Document Guidelines</Text>
            <Text style={styles.guidelineText}>• Clear, readable photo of the document</Text>
            <Text style={styles.guidelineText}>• All 4 corners of the document visible</Text>
            <Text style={styles.guidelineText}>• No flash reflection or shadows</Text>
            <Text style={styles.guidelineText}>• File size should be less than 5MB</Text>
            <Text style={styles.guidelineText}>• Accepted formats: JPG, PNG, PDF</Text>
          </View>
        </View>
      )} */}

      {activeSection === "documents" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Document Links</Text>

          {renderDocumentCard(
            "Driver License",
            "license",
            profile.licensePhoto,
            (text) => setProfile({ ...profile, licensePhoto: text }),
            true
          )}
          {renderDocumentCard(
            "Vehicle RC",
            "rc",
            profile.vehicleRCPhoto,
            (text) => setProfile({ ...profile, vehicleRCPhoto: text }),
            true
          )}
          {renderDocumentCard(
            "Insurance",
            "insurance",
            profile.insurancePhoto,
            (text) => setProfile({ ...profile, insurancePhoto: text }),
            true
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📌 Document Guidelines</Text>
            <Text style={styles.guidelineText}>• Upload your document to Google Drive</Text>
            <Text style={styles.guidelineText}>• Set sharing to "Anyone with the link"</Text>
            <Text style={styles.guidelineText}>• Paste the shareable link above</Text>
            <Text style={styles.guidelineText}>• Make sure the document is clear and complete</Text>
          </View>
        </View>
      )}

      {/* Bank Details Section */}
      {activeSection === "bank" && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Bank & Payment Details</Text>
          
          <View style={styles.infoCard}>
            {renderInputField(
              "Bank Name",
              profile.bankName,
              (text) => setProfile({ ...profile, bankName: text }),
              "Enter bank name",
              "default",
              editing
            )}
            
            {renderInputField(
              "Account Number",
              profile.accountNumber,
              (text) => setProfile({ ...profile, accountNumber: text }),
              "Enter account number",
              "numeric",
              editing
            )}
            
            {renderInputField(
              "IFSC Code",
              profile.ifscCode,
              (text) => setProfile({ ...profile, ifscCode: text }),
              "Enter IFSC code",
              "default",
              editing
            )}
            
            {renderInputField(
              "UPI ID",
              profile.upiId,
              (text) => setProfile({ ...profile, upiId: text }),
              "Enter UPI ID",
              "default",
              editing
            )}
          </View>

          <View style={styles.earningsCard}>
            <Text style={styles.earningsTitle}>💰 Earnings Summary</Text>
            <View style={styles.earningsRow}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>This Week</Text>
                <Text style={styles.earningsValue}>₹5,240</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>This Month</Text>
                <Text style={styles.earningsValue}>₹24,850</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.withdrawButton}>
              <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
            </TouchableOpacity>
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
    marginBottom: 9
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
  documentList: {
    gap: 8,
  },
  documentListItem: {
    fontSize: 13,
    color: "#1A2B25",
  },
  guidelineText: {
    fontSize: 12,
    color: "#6B7B76",
    marginBottom: 8,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Document Cards
  documentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A2B25",
  },
  requiredBadge: {
    fontSize: 11,
    color: "#E05C5C",
    backgroundColor: "rgba(224,92,92,0.10)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  documentUploadArea: {
    width: "100%",
    height: 120,
    backgroundColor: "#F4F7F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E9E8",
    overflow: "hidden",
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: "#6B7B76",
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 11,
    color: "#9AA8A4",
  },
  documentPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Earnings Card
  earningsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 16,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    color: "#6B7B76",
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0EA571",
  },
  withdrawButton: {
    backgroundColor: "#0EA571",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  bottomPadding: {
    height: 30,
  },
  openLinkBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "rgba(14,165,113,0.10)",
  },
  openLinkText: {
    color: "#0EA571",
    fontWeight: "600",
    fontSize: 13,
  },
});