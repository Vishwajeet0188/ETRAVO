import React, { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:4000/api"
    : "http://localhost:4000/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type Passenger = {
  name: string;
  initials: string;
  id: string;
  email: string;
  phone: string;
};

type TripStatus = "pending" | "accepted" | "completed" | "declined" | "cancelled";

type Trip = {
  id: string;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  dropoffTime: string;
  fare: number;
  distance: string;
  seats: number;
  status: TripStatus;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
};

type PassengerStats = {
  totalTrips: number;
  totalSpent: number;
  cancelledTrips: number;
  rating: string;
};

type Activity = {
  id: string;
  title: string;
  amount: string;
  time: string;
  icon: string;
  status: TripStatus;
};

console.log("PASSENGER PAGE LOADED");

// ── API calls ────────────────────────────────────────────

async function fetchPassengerDashboard(token: string): Promise<{
  stats: PassengerStats;
  activities: {
    id: string;
    title: string;
    amount: string;
    status: TripStatus;
    created_at: string;
  }[];
}> {
  // const response = await fetch("http://localhost:4000/api/passenger/dashboard", {
  const response = await fetch (`${BASE_URL}/passenger/dashboard`,{
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch passenger dashboard");
  return response.json();
}

async function fetchActiveTrip(token: string): Promise<Trip | null> {
  // const response = await fetch("http://localhost:4000/api/passenger/active-trip", {
  const response = await fetch(`${BASE_URL}/passenger/active-trip`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.trip || null;
}

async function createTripRequest(
  token: string,
  payload: {
    pickup: string;
    dropoff: string;
    pickupTime: string;
    seats: number;
    fare: number;
  }
): Promise<Trip> {
  // const response = await fetch("http://localhost:4000/api/passenger/trips", {
  const response = await fetch(`${BASE_URL}/passenger/trips`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create trip");
  }
  return response.json();
}

async function cancelTrip(token: string, tripId: string): Promise<void> {
  // const response = await fetch(`http://localhost:4000/api/passenger/trips/${tripId}/cancel`, {
  const response = await fetch(`${BASE_URL}/passenger/trips/${tripId}/cancel`,{
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to cancel trip");
}

async function fetchTripHistory(token: string): Promise<Trip[]> {
  // const response = await fetch("http://localhost:4000/api/passenger/trips/history", {
  const response = await fetch(`${BASE_URL}/passenger/trips/history`,{
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.trips || [];
}

// ── Helpers ──────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};
const getGreetingEmoji = () => {
  const h = new Date().getHours();
  if (h < 12) return "🌅";
  if (h < 17) return "☀️";
  return "🌙";
};

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: "Waiting for driver",   color: "#F59E0B", bg: "#451A03", icon: "⏳" },
  accepted:  { label: "Driver on the way",    color: "#3B82F6", bg: "#1E3A8A", icon: "🚗" },
  completed: { label: "Completed",            color: "#10B981", bg: "#065F46", icon: "✅" },
  declined:  { label: "No drivers available", color: "#EF4444", bg: "#450A0A", icon: "❌" },
  cancelled: { label: "Cancelled",            color: "#94A3B8", bg: "#1E293B", icon: "🚫" },
};

// ── Main Component ────────────────────────────────────────
export default function PassengerDashboard() {
  const { user, token } = useAuth();

  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<PassengerStats>({
    totalTrips: 0,
    totalSpent: 0,
    cancelledTrips: 0,
    rating: "0.0",
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  // New Trip Modal
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [form, setForm] = useState({
    pickup: "",
    dropoff: "",
    pickupTime: "",
    seats: "1",
    fare: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Poll for active trip status every 10s when there's a pending/accepted trip
  useEffect(() => {
    if (!activeTrip || activeTrip.status === "completed" || activeTrip.status === "cancelled") return;
    const interval = setInterval(async () => {
      const trip = await fetchActiveTrip(token || "").catch(() => null);
      if (trip) setActiveTrip(trip);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTrip, token]);

  const loadData = useCallback(async () => {
    try {
      const [dashData, activeTripData] = await Promise.all([
        fetchPassengerDashboard(token || ""),
        fetchActiveTrip(token || ""),
      ]);

      setPassenger({
        name: user?.name || "Passenger",
        initials:
          user?.name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase() || "P",
        id: user?.id || "",
        email: user?.email || "",
        phone: user?.phone || "",
      });

      setStats(dashData.stats);

      setActivities(
        dashData.activities.map((a) => ({
          id: a.id,
          title: a.title,
          amount: `₹${a.amount}`,
          time: new Date(a.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          icon: STATUS_CONFIG[a.status]?.icon || "📋",
          status: a.status,
        }))
      );

      setActiveTrip(activeTripData);
    } catch (err) {
      console.error("Passenger dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Validate then show confirm Alert before submitting ───────
  const handleRequestRidePress = () => {
    console.log("REQUEST BUTTON CLICKED");
    const { pickup, dropoff, pickupTime, seats, fare } = form;

    if (!pickup.trim() || !dropoff.trim() || !pickupTime.trim()) {
      Alert.alert("Missing Info", "Please fill in pickup, dropoff, and pickup time.");
      return;
    }
    const seatsNum = parseInt(seats, 10);
    if (isNaN(seatsNum) || seatsNum < 1 || seatsNum > 6) {
      Alert.alert("Invalid Seats", "Seats must be between 1 and 6.");
      return;
    }
    const fareNum = parseFloat(fare);
    if (isNaN(fareNum) || fareNum <= 0) {
      Alert.alert("Invalid Fare", "Please enter a valid fare amount.");
      return;
    }

    const confirmed = window.confirm(
      `🚕 Confirm Ride Request

    Pickup: ${pickup.trim()}

    Destination: ${dropoff.trim()}

    Time: ${pickupTime.trim()}

    Seats: ${seatsNum}

    Fare: ₹${fareNum}

    Are you sure you want to request this ride?`
    );

    if (confirmed) {
      handleSubmitTrip();
    }
    //  Alert.alert("TEST", "Button Clicked");
  };

  // ── Actually POST the trip after alert confirmation ──────────
  const handleSubmitTrip = async () => {
    const { pickup, dropoff, pickupTime, seats, fare } = form;
    const seatsNum = parseInt(seats, 10);
    const fareNum = parseFloat(fare);

    setSubmitting(true);
    try {
      const newTrip = await createTripRequest(token || "", {
        pickup: pickup.trim(),
        dropoff: dropoff.trim(),
        pickupTime: pickupTime.trim(),
        seats: seatsNum,
        fare: fareNum,
      });
      setActiveTrip(newTrip);
      setShowNewTrip(false);
      setForm({ pickup: "", dropoff: "", pickupTime: "", seats: "1", fare: "" });
      Alert.alert("Trip Requested! 🎉", "Your trip request has been sent to nearby drivers.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not create trip. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel Trip — Alert based ────────────────────────────────
  const handleCancelPress = () => {
    Alert.alert(
      "⚠️ Cancel Trip?",
      `Are you sure you want to cancel your trip to\n${activeTrip?.dropoff}?`,
      [
        { text: "Keep Trip", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: confirmCancel },
      ]
    );
  };

  const confirmCancel = async () => {
    if (!activeTrip) return;
    try {
      await cancelTrip(token || "", activeTrip.id);
      setActiveTrip({ ...activeTrip, status: "cancelled" });
      Alert.alert("Trip Cancelled", "Your trip has been cancelled.");
      await loadData();
    } catch {
      Alert.alert("Error", "Could not cancel trip. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const canBook =
    !activeTrip ||
    activeTrip.status === "completed" ||
    activeTrip.status === "cancelled" ||
    activeTrip.status === "declined";
  const activeTripStatus = activeTrip ? STATUS_CONFIG[activeTrip.status] : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#030d29" />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greetingEmoji}>{getGreetingEmoji()}</Text>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.passengerName}>{passenger?.name?.split(" ")[0]}!</Text>
            <View style={styles.statusBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Ready to ride</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileCircle}
            onPress={() => router.push("/(passenger)/profile" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.profileInitials}>{passenger?.initials}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContainer}
        >
          {[
            { value: stats.totalTrips,        label: "Total Trips" },
            { value: `₹${stats.totalSpent}`,  label: "Total Spent" },
            { value: stats.rating,             label: "My Rating" },
            { value: stats.cancelledTrips,     label: "Cancelled" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Book a Ride CTA ── */}
        {canBook && (
          <TouchableOpacity
            style={styles.bookCTA}
            onPress={() => setShowNewTrip(true)}
            activeOpacity={0.85}
          >
            <View style={styles.bookCTALeft}>
              <Text style={styles.bookCTAIcon}>🚕</Text>
              <View>
                <Text style={styles.bookCTATitle}>Book a Ride</Text>
                <Text style={styles.bookCTASubtitle}>Find drivers near you instantly</Text>
              </View>
            </View>
            <View style={styles.bookArrow}>
              <Text style={styles.bookArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Active Trip Banner ── */}
        {activeTrip && activeTripStatus && (
          <View style={[styles.activeTripBanner, { borderColor: activeTripStatus.color }]}>
            <View style={styles.bannerTop}>
              <Text style={styles.bannerStatusIcon}>{activeTripStatus.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerStatus, { color: activeTripStatus.color }]}>
                  {activeTripStatus.label}
                </Text>
                {activeTrip.driverName && (
                  <Text style={styles.bannerDriver}>Driver: {activeTrip.driverName}</Text>
                )}
              </View>
              {(activeTrip.status === "pending" || activeTrip.status === "accepted") && (
                <TouchableOpacity
                  style={styles.cancelSmallBtn}
                  onPress={handleCancelPress}
                >
                  <Text style={styles.cancelSmallText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.bannerRoute}>
              <View style={styles.routeRow}>
                <View style={[styles.dot, { backgroundColor: "#3B82F6" }]} />
                <Text style={styles.routeText} numberOfLines={1}>{activeTrip.pickup}</Text>
                <Text style={styles.routeTime}>{activeTrip.pickupTime}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.routeText} numberOfLines={1}>{activeTrip.dropoff}</Text>
                {activeTrip.dropoffTime && (
                  <Text style={styles.routeTime}>{activeTrip.dropoffTime}</Text>
                )}
              </View>
            </View>
            <View style={styles.bannerMeta}>
              <Text style={styles.bannerMetaText}>💺 {activeTrip.seats} seats</Text>
              {activeTrip.distance && (
                <Text style={styles.bannerMetaText}>📏 {activeTrip.distance}</Text>
              )}
              <Text style={styles.bannerMetaText}>💰 ₹{activeTrip.fare}</Text>
            </View>
          </View>
        )}

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Recent Trips</Text>
            <TouchableOpacity onPress={() => router.push("/(passenger)/history" as any)}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {activities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🗺️</Text>
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptyText}>Book your first ride above!</Text>
              </View>
            ) : (
              activities.slice(0, 5).map((a, i) => (
                <React.Fragment key={a.id}>
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Text style={styles.activityIconText}>{a.icon}</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{a.title}</Text>
                      <Text style={styles.activityTime}>{a.time}</Text>
                    </View>
                    <View style={[styles.activityAmount, { backgroundColor: STATUS_CONFIG[a.status]?.bg || "#1E293B" }]}>
                      <Text style={[styles.activityAmountText, { color: STATUS_CONFIG[a.status]?.color || "#fff" }]}>
                        {a.amount}
                      </Text>
                    </View>
                  </View>
                  {i < activities.slice(0, 5).length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))
            )}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: "📊", label: "History",  route: "/(passenger)/history" },
              { icon: "💳", label: "Payments", route: "/(passenger)/payments" },
              { icon: "⚙️",  label: "Settings", route: "/(passenger)/profile" },
              { icon: "🆘", label: "SOS",      route: "/(passenger)/sos" },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionBtn}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── New Trip Modal ── */}
      <Modal
        visible={showNewTrip}
        transparent
        animationType="slide"
        onRequestClose={() => !submitting && setShowNewTrip(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.newTripModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🚕 Book a Ride</Text>
            <Text style={styles.modalSubtitle}>Tell us where you're headed</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>📍 Pickup Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                placeholderTextColor="#475569"
                value={form.pickup}
                onChangeText={(v) => setForm((f) => ({ ...f, pickup: v }))}
                editable={!submitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>🏁 Drop-off Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter destination address"
                placeholderTextColor="#475569"
                value={form.dropoff}
                onChangeText={(v) => setForm((f) => ({ ...f, dropoff: v }))}
                editable={!submitting}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>🕐 Pickup Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 09:30 AM"
                  placeholderTextColor="#475569"
                  value={form.pickupTime}
                  onChangeText={(v) => setForm((f) => ({ ...f, pickupTime: v }))}
                  editable={!submitting}
                />
              </View>
              <View style={[styles.formGroup, { width: 90 }]}>
                <Text style={styles.formLabel}>💺 Seats</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor="#475569"
                  value={form.seats}
                  onChangeText={(v) => setForm((f) => ({ ...f, seats: v }))}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!submitting}
                />
              </View>
            </View>

            {/* ── Fare field — correctly inside booking modal ── */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>💰 Fare (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter fare amount"
                placeholderTextColor="#475569"
                value={form.fare}
                onChangeText={(v) => setForm((f) => ({ ...f, fare: v }))}
                keyboardType="numeric"
                editable={!submitting}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowNewTrip(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
                onPress={handleRequestRidePress}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Request Ride</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F6" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F7F6" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7B76" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 23,
    borderBottomRightRadius: 23,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E9E8",
  },
  headerContent: { flex: 1, alignItems: "center" },
  greetingEmoji: { fontSize: 32, marginBottom: 4 },
  greeting: { fontSize: 25, color: "#5B6B66", fontWeight: "500" },
  passengerName: { fontSize: width > 400 ? 26 : 22, fontWeight: "700", color: "#1A2B25", marginTop: 5 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "rgba(14,165,113,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0EA571" },
  statusText: { fontSize: 13, color: "#0EA571", fontWeight: "500" },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0EA571",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInitials: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },

  statsScroll: { flexGrow: 0, marginTop: 16 },
  statsContainer: { paddingHorizontal: 16, gap: 12 },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 16,
    padding: 14,
    width: width * 0.24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1A2B25", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#6B7B76", fontWeight: "500" },

  bookCTA: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#0EA571",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bookCTALeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  bookCTAIcon: { fontSize: 32 },
  bookCTATitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  bookCTASubtitle: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  bookArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookArrowText: { fontSize: 18, color: "#FFFFFF", fontWeight: "700", marginBottom: 3 },

  activeTripBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E4E9E8",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  bannerStatusIcon: { fontSize: 24 },
  bannerStatus: { fontSize: 14, fontWeight: "700" },
  bannerDriver: { fontSize: 12, color: "#6B7B76", marginTop: 2 },
  cancelSmallBtn: {
    backgroundColor: "rgba(224,92,92,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelSmallText: { fontSize: 12, fontWeight: "600", color: "#E05C5C" },
  bannerRoute: { marginBottom: 12 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 13, fontWeight: "500", color: "#1A2B25" },
  routeTime: { fontSize: 12, color: "#0EA571", fontWeight: "500" },
  routeLine: { width: 2, height: 14, backgroundColor: "#E4E9E8", marginLeft: 4, marginVertical: 3 },
  bannerMeta: { flexDirection: "row", gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E4E9E8" },
  bannerMetaText: { fontSize: 12, color: "#6B7B76", fontWeight: "500" },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A2B25" },
  viewAllText: { fontSize: 12, color: "#0EA571", fontWeight: "500" },

  activityCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F7F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityIconText: { fontSize: 18 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "500", color: "#1A2B25", marginBottom: 4 },
  activityTime: { fontSize: 11, color: "#6B7B76" },
  activityAmount: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  activityAmountText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E4E9E8", marginVertical: 2 },

  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#1A2B25", marginBottom: 4 },
  emptyText: { fontSize: 13, color: "#6B7B76" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  actionBtn: {
    width: (width - 90) / 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 11, fontWeight: "500", color: "#6B7B76" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  newTripModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E4E9E8",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1A2B25", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "#6B7B76", marginBottom: 20 },

  formGroup: { marginBottom: 14 },
  formRow: { flexDirection: "row" },
  formLabel: { fontSize: 13, fontWeight: "600", color: "#5B6B66", marginBottom: 8 },
  input: {
    backgroundColor: "#F4F7F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A2B25",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },

  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#6B7B76" },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#0EA571",
  },
  dangerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#E05C5C",
  },
  confirmBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  confirmModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmIcon: { fontSize: 36, marginBottom: 14 },
  confirmMessage: { fontSize: 14, color: "#6B7B76", textAlign: "center", marginBottom: 24, lineHeight: 22 },
});