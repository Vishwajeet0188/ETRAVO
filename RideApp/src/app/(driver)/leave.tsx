import React, { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:4000/api"
    : "http://localhost:4000/api";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Modal
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type LeaveSummary = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

type LeaveRecord = {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
};

const LEAVE_TYPES = ["Sick Leave", "Casual Leave", "Emergency Leave", "Other"];

// ── API calls ────────────────────────────────────────────
// const BASE_URL = "http://localhost:4000/api";

async function getLeaveSummary(token: string): Promise<LeaveSummary> {
  const res = await fetch(`${BASE_URL}/leave/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch leave summary");
  return res.json();
}

async function getLeaveHistory(token: string): Promise<LeaveRecord[]> {
  const res = await fetch(`${BASE_URL}/leave/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch leave history");
    const data = await res.json();
    // console.log("Leave History API Response:", data);

    return data.records || data;
}

async function cancelLeave(token: string, leaveId: string) {
  const res = await fetch(`${BASE_URL}/leave/${leaveId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to cancel leave");

  return res.json();
}

async function applyLeave(
  token: string,
  payload: { type: string; fromDate: string; toDate: string; reason: string }
): Promise<LeaveRecord> {
  const res = await fetch(`${BASE_URL}/leave/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to apply leave");
  return res.json();
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


// ── Component ────────────────────────────────────────────
export default function Leave() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [summary, setSummary] = useState<LeaveSummary>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);

  // Form state
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const loadLeaveData = useCallback(async () => {
    try {
      const [summaryData, historyData] = await Promise.all([
        getLeaveSummary(token || ""),
        getLeaveHistory(token || ""),
      ]);
      setSummary(summaryData);
      setLeaveHistory(historyData);
    } catch (error) {
      console.log("Leave load failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaveData();
  };

  const resetForm = () => {
    setLeaveType("");
    setFromDate("");
    setToDate("");
    setReason("");
  };

  const handleSubmit = async () => {
    if (!leaveType) {
      Alert.alert("Missing Info", "Please select a leave type.");
      return;
    }
    if (!fromDate || !toDate) {
      Alert.alert("Missing Info", "Please enter both From and To dates.");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Missing Info", "Please enter a reason for leave.");
      return;
    }

    setSubmitting(true);
    try {
      await applyLeave(token || "", {
        type: leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
      });

      setShowSuccessModal(true);
      resetForm();
      loadLeaveData();
    } catch (error) {
      Alert.alert("Error", "Could not submit leave request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
        try {
            await cancelLeave(token || "", leaveId);

            Alert.alert(
            "Success",
            "Leave request cancelled successfully."
            );

            loadLeaveData();
        } catch (error) {
            Alert.alert(
            "Error",
            "Failed to cancel leave."
            );
        }
    };

  const getStatusColor = (status: string) => {
    if (status === "Approved") return { bg: "#065F46", text: "#10B981" };
    if (status === "Rejected") return { bg: "#7F1D1D", text: "#EF4444" };
    return { bg: "#78350F", text: "#F59E0B" };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading leave data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
      }
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
                router.push("/(driver)/dashboard");
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave</Text>
          <View style={{ width: 38 }} />
        </View>
        <Text style={styles.notes}>You Can Apply For Leave and Check Your Consumed/Remaining Leave.</Text>
      </View>

      {/* SUMMARY CARDS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#10B981" }]}>{summary.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{summary.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>{summary.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* APPLY LEAVE CARD */}
      <View style={styles.applyCard}>
        <Text style={styles.applyTitle}>Apply Leave</Text>

        {/* Leave Type Dropdown */}
        <Text style={styles.inputLabel}>Leave Type</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          activeOpacity={0.7}
        >
          <Text style={leaveType ? styles.dropdownValue : styles.dropdownPlaceholder}>
            {leaveType || "Select leave type"}
          </Text>
          <Text style={styles.dropdownArrow}>{showTypeDropdown ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {showTypeDropdown && (
          <View style={styles.dropdownList}>
            {LEAVE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.dropdownItem}
                onPress={() => {
                  setLeaveType(type);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* From Date */}
        <Text style={styles.inputLabel}>From Date</Text>
        <TextInput
          style={styles.textInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748B"
          value={fromDate}
          onChangeText={setFromDate}
        />

        {/* To Date */}
        <Text style={styles.inputLabel}>To Date</Text>
        <TextInput
          style={styles.textInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748B"
          value={toDate}
          onChangeText={setToDate}
        />

        {/* Reason */}
        <Text style={styles.inputLabel}>Reason</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Enter reason for leave"
          placeholderTextColor="#64748B"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* LEAVE HISTORY */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Leave History</Text>

        {leaveHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No leave requests yet</Text>
          </View>
        ) : (
          leaveHistory.map((leave) => {
            const colors = getStatusColor(leave.status);
            return (
              <View key={leave.id} style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <Text style={styles.leaveType}>{leave.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.text }]}>
                      {leave.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.leaveDates}>
                    {formatDate(leave.fromDate)} → {formatDate(leave.toDate)}
                </Text>

                <Text style={styles.leaveReason}>{leave.reason}</Text>

                <Text style={styles.leaveAppliedOn}>
                    Applied on {formatDateTime(leave.appliedOn)}
                </Text>
                 {leave.status === "Pending" && (
                    <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                    onPress={() => handleCancelLeave(leave.id)}
                    >
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                    </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>

        <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSuccessModal(false)}
            >
            <View style={styles.modalOverlay}>
                <View style={styles.successModal}>
                <Text style={styles.successIcon}>✅</Text>

                <Text style={styles.successTitle}>
                    Leave Applied Successfully
                </Text>

                <Text style={styles.successMessage}>
                    Your leave request has been submitted.
                    Please check the status in Leave History.
                </Text>

                <TouchableOpacity
                    style={styles.successButton}
                    onPress={() => setShowSuccessModal(false)}
                >
                    <Text style={styles.successButtonText}>
                    OK
                    </Text>
                </TouchableOpacity>
                </View>
            </View>
        </Modal>

    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F6" },
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
  notes: {
    marginTop: 8,
    fontSize: 18,
    textAlign: "center",
    justifyContent: "center",
    color: "#1A2B25"
  },
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
    marginTop: 40,
    zIndex: 1,
  },
  backIcon: {
    fontSize: 22,
    color: "#1A2B25",
    fontWeight: "600",
    marginBottom: 7,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A2B25" },

  // Summary cards
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7B76",
  },

  // Apply Leave
  applyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  applyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B6B66",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F4F7F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A2B25",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  dropdownBtn: {
    backgroundColor: "#F4F7F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E4E9E8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownValue: {
    fontSize: 14,
    color: "#1A2B25",
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: "#9AA8A4",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#6B7B76",
  },
  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E4E9E8",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E9E8",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#1A2B25",
  },
  submitBtn: {
    backgroundColor: "#0EA571",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // History
  historySection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 30,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 12,
  },
  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B25",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  leaveDates: {
    fontSize: 12,
    color: "#0EA571",
    fontWeight: "500",
    marginBottom: 6,
  },
  leaveReason: {
    fontSize: 13,
    color: "#6B7B76",
    marginBottom: 8,
  },
  leaveAppliedOn: {
    fontSize: 11,
    color: "#9AA8A4",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7B76",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  successModal: {
    width: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },

  successIcon: {
    fontSize: 50,
    marginBottom: 12,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 10,
  },

  successMessage: {
    fontSize: 14,
    color: "#6B7B76",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  successButton: {
    backgroundColor: "#0EA571",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },

  successButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  cancelBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(224,92,92,0.10)",
  },
  cancelBtnText: {
    color: "#E05C5C",
    fontWeight: "600",
    fontSize: 12,
  },
});