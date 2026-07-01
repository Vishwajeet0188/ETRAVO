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
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type Summary = {
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
};

type TodayAttendance = {
  status: "Present" | "Absent";
  checkIn: string | null;
  checkOut: string | null;
};

type HistoryRecord = {
  date: string;
  status: "Present" | "Absent";
  checkIn: string | null;
  checkOut: string | null;
};

// ── API calls ────────────────────────────────────────────
// const BASE_URL = "http://localhost:4000/api";

async function getAttendanceSummary(token: string): Promise<Summary> {
  const res = await fetch(`${BASE_URL}/attendance/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

async function getTodayAttendance(token: string): Promise<TodayAttendance> {
  const res = await fetch(`${BASE_URL}/attendance/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch today's attendance");
  return res.json();
}

async function getAttendanceHistory(token: string): Promise<HistoryRecord[]> {
  const res = await fetch(`${BASE_URL}/attendance/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch history");
  const data = await res.json();
  return data.records || data;
}

async function markAttendance(token: string): Promise<TodayAttendance> {
  const res = await fetch(`${BASE_URL}/attendance/mark`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to mark attendance");
  return res.json();
}

async function checkoutAttendance(token: string): Promise<TodayAttendance> {
  const res = await fetch(`${BASE_URL}/attendance/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to check out");
  return res.json();
}

// Function for time converter:

const formatTime = (timeString: string | null) => {
  if (!timeString) return "--";

  const date = new Date(`1970-01-01T${timeString}`);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Component ────────────────────────────────────────────
export default function Attendance() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const [summary, setSummary] = useState<Summary>({
    presentDays: 0,
    absentDays: 0,
    attendancePercentage: 0,
  });

  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    status: "Absent",
    checkIn: null,
    checkOut: null,
  });

  const [attendanceHistory, setAttendanceHistory] = useState<HistoryRecord[]>([]);

  const loadAttendance = useCallback(async () => {
    try {
      const [summaryData, todayData, historyData] = await Promise.all([
        getAttendanceSummary(token || ""),
        getTodayAttendance(token || ""),
        getAttendanceHistory(token || ""),
      ]);

      setSummary(summaryData);
      setTodayAttendance(todayData);
      setAttendanceHistory(historyData);
    } catch (error) {
      console.log("Attendance load failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  const handleMarkAttendance = async () => {
    setMarking(true);
    try {
      const result = await markAttendance(token || "");
      setTodayAttendance(result);
      Alert.alert("Attendance Marked", `Check In: ${result.checkIn}`);
      // Refresh summary + history too since they may have changed
      loadAttendance();
    } catch (error) {
      Alert.alert("Error", "Could not mark attendance. Try again.");
    } finally {
      setMarking(false);
    }
  };

  const handleCheckout = async () => {
    setMarking(true);
    try {
      const result = await checkoutAttendance(token || "");
      setTodayAttendance(result);
      Alert.alert("Checked Out", `Check Out: ${result.checkOut}`);
      loadAttendance();
    } catch (error) {
      Alert.alert("Error", "Could not check out. Try again.");
    } finally {
      setMarking(false);
    }
  };

  const isPresent = todayAttendance.status === "Present";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
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
          <Text style={styles.headerTitle}>Attendance</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.presentDays}</Text>
          <Text style={styles.statLabel}>Present</Text>
          <Text style={styles.statSubLabel}>Days</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.absentDays}</Text>
          <Text style={styles.statLabel}>Absent</Text>
          <Text style={styles.statSubLabel}>Days</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.statValueAccent]}>
            {summary.attendancePercentage}%
          </Text>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={styles.statSubLabel}>Overall</Text>
        </View>
      </View>

      {/* TODAY'S STATUS */}
      <View style={styles.todayCard}>
        <Text style={styles.todayTitle}>Today's Status</Text>

        {!isPresent && (
          <Text style={styles.notice}>
            NOTE: By Default Attendance will be Absent. You have to mark it for present.
          </Text>
        )}

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isPresent ? "#10B981" : "#EF4444" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isPresent ? "#10B981" : "#EF4444" },
            ]}
          >
            {todayAttendance.status}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Check-in :</Text>
          <Text style={styles.timeValue}>
            {formatTime(todayAttendance.checkIn)}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Check-out :</Text>
          <Text style={styles.timeValue}>
            {formatTime(todayAttendance.checkOut)}
          </Text>
        </View>

        {!isPresent ? (
          <TouchableOpacity
            style={styles.markBtn}
            activeOpacity={0.8}
            onPress={handleMarkAttendance}
            disabled={marking}
          >
            {marking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.markBtnText}>Mark Attendance</Text>
            )}
          </TouchableOpacity>
        ) : !todayAttendance.checkOut ? (
          <TouchableOpacity
            style={[styles.markBtn, styles.checkoutBtn]}
            activeOpacity={0.8}
            onPress={handleCheckout}
            disabled={marking}
          >
            {marking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.markBtnText}>Mark Check-out</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>✅ Day completed</Text>
          </View>
        )}
      </View>

      {/* ATTENDANCE HISTORY */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Attendance History</Text>

        {attendanceHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No attendance records yet</Text>
          </View>
        ) : (
          attendanceHistory.map((record) => (
            <View key={`${record.date}-${record.status}`} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>{record.date}</Text>
                <View
                  style={[
                    styles.historyBadge,
                    record.status === "Present" ? styles.badgePresent : styles.badgeAbsent,
                  ]}
                >
                  <Text
                    style={[
                      styles.historyBadgeText,
                      record.status === "Present"
                        ? styles.badgeTextPresent
                        : styles.badgeTextAbsent,
                    ]}
                  >
                    {record.status}
                  </Text>
                </View>
              </View>

              {record.status === "Present" && (
                <View style={styles.historyTimes}>
                  <Text style={styles.historyTimeText}>
                    Check In:  {formatTime(record.checkIn)}
                  </Text>
                  <Text style={styles.historyTimeText}>
                    Check Out: {formatTime(record.checkOut)}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
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

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 4,
  },
  statValueAccent: {
    color: "#0EA571",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2B25",
  },
  statSubLabel: {
    fontSize: 10,
    color: "#6B7B76",
    marginTop: 1,
  },

  todayCard: {
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
  todayTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 14,
  },
  notice: {
    textAlign: "center",
    color: "#E05C5C",
    fontSize: 12,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 13,
    color: "#6B7B76",
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A2B25",
  },
  markBtn: {
    backgroundColor: "#0EA571",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  checkoutBtn: {
    backgroundColor: "#F59E0B",
  },
  markBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  doneBadge: {
    alignItems: "center",
    marginTop: 12,
  },
  doneBadgeText: {
    color: "#0EA571",
    fontWeight: "600",
    fontSize: 13,
  },

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
  historyCard: {
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2B25",
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePresent: {
    backgroundColor: "rgba(14,165,113,0.10)",
  },
  badgeAbsent: {
    backgroundColor: "rgba(224,92,92,0.10)",
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTextPresent: {
    color: "#0EA571",
  },
  badgeTextAbsent: {
    color: "#E05C5C",
  },
  historyTimes: {
    marginTop: 10,
    gap: 4,
  },
  historyTimeText: {
    fontSize: 12,
    color: "#6B7B76",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7B76",
  },
});