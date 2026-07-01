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
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router"; 

const { width } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type Trip = {
  id: string;
  passengerName: string;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  fare: number;
  distance: string;
  seats: number;
  status: "pending" | "accepted" | "completed" | "declined";
  createdAt: Date;
};

type TabKey = "pending" | "active" | "completed";

// ── API ──────────────────────────────────────────────────
async function fetchAvailableTrips(token: string) {
  // const res = await fetch("http://localhost:4000/api/dashboard/available-trips", {
  const res = await fetch(`${BASE_URL}/dashboard/available-trips`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch trips");
  return res.json();
}

async function fetchMyTrips(token: string, status?: string) {
  // const url = status
  //   ? `http://localhost:4000/api/trips/mine?status=${status}`
  //   : `http://localhost:4000/api/trips/mine`;
    const url = status
    ? `${BASE_URL}/trips/mine?status=${status}`
    : `${BASE_URL}/trips/mine`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Failed to fetch trips");
  return res.json();
}

async function updateTripStatus(token: string, tripId: string, status: string) {
  // const res = await fetch(`http://localhost:4000/api/trips/${tripId}/status`, {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update trip");
  return res.json();
}

// ── Mapper ───────────────────────────────────────────────
function mapTrip(t: any): Trip {
  return {
    id: String(t.id),
    passengerName: t.passenger_id ? `Passenger #${t.passenger_id}` : t.passenger_name || "Passenger",
    pickup: t.pickup_location,
    dropoff: t.destination_location,
    pickupTime: t.pickup_time,
    fare: Number(t.fare || 0),
    distance: t.distance || "N/A",
    seats: t.seats || 1,
    status: t.status,
    createdAt: new Date(t.created_at),
  };
}

// ── Component ────────────────────────────────────────────
export default function TripsScreen() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const load = useCallback(async () => {
    try {
      let data;
      if (activeTab === "pending") {
        data = await fetchAvailableTrips(token || "");
        setTrips((data.trips || []).map(mapTrip));
      } else {
        data = await fetchMyTrips(token || "", activeTab === "active" ? "accepted" : "completed");
        setTrips((data.trips || []).map(mapTrip));
      }
    } catch (e) {
      console.error("Trips load failed:", e);
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAccept = async (trip: Trip) => {
    setBusyId(trip.id);
    try {
      await updateTripStatus(token || "", trip.id, "accepted");
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
      Alert.alert("Trip Accepted", `Pickup at ${trip.pickupTime}`);
    } catch (e) {
        console.log("ACCEPT ERROR:", e);

        Alert.alert(
            "Error",
            JSON.stringify(e)
        );
        } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (trip: Trip) => {
    setBusyId(trip.id);
    try {
      await updateTripStatus(token || "", trip.id, "declined");
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    } catch (e) {
      Alert.alert("Error", "Could not decline trip. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (trip: Trip) => {
    setBusyId(trip.id);
    try {
      await updateTripStatus(token || "", trip.id, "completed");
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
      Alert.alert("Trip Completed", `You earned ₹${trip.fare}`);
    } catch (e) {
      Alert.alert("Error", "Could not complete trip. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmAccept = async () => {
        if (!selectedTrip) return;

        await handleAccept(selectedTrip);

        setShowAcceptModal(false);

        Alert.alert(
            "Trip Accepted ✅",
            "The trip has been moved to the Active tab.\n\nGo to Active Trips to manage this ride."
        );
    };

    const confirmDecline = async () => {
        if (!selectedTrip) return;

        await handleDecline(selectedTrip);

        setShowDeclineModal(false);

        Alert.alert(
            "Trip Declined ❌",
            "The trip request has been removed from your pending trips."
        );
    };

  const TABS: { key: TabKey; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
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
                <Text style={styles.headerTitle}>My Trips</Text>
                <View style={{ width: 38 }} />
            </View> 
        </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
          }
        >
          {trips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>
                {activeTab === "pending" ? "🚕" : activeTab === "active" ? "🚗" : "✅"}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "pending"
                  ? "No available trips"
                  : activeTab === "active"
                  ? "No active trip"
                  : "No completed trips yet"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "pending"
                  ? "New ride requests will show up here"
                  : activeTab === "active"
                  ? "Accept a trip to see it here"
                  : "Finished trips will appear here"}
              </Text>
            </View>
          ) : (
            trips.map((trip) => (
              <View key={trip.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.passengerName}>{trip.passengerName}</Text>
                  <View style={styles.fareBadge}>
                    <Text style={styles.fareText}>₹{trip.fare}</Text>
                  </View>
                </View>

                <View style={styles.routeRow}>
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>PICKUP</Text>
                    <Text style={styles.routeValue}>{trip.pickup}</Text>
                    <Text style={styles.routeTime}>{trip.pickupTime}</Text>
                  </View>
                  <View style={styles.routeCol}>
                    <Text style={styles.routeLabel}>DROPOFF</Text>
                    <Text style={styles.routeValue}>{trip.dropoff}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📏 {trip.distance}</Text>
                  <Text style={styles.metaText}>👥 {trip.seats} seats</Text>
                </View>

                {activeTab === "pending" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      disabled={busyId === trip.id}
                      onPress={() => {
                        setSelectedTrip(trip);
                        setShowDeclineModal(true);
                        }}
                    >
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      disabled={busyId === trip.id}
                      onPress={() => {
                        setSelectedTrip(trip);
                        setShowAcceptModal(true);
                        }}
                    >
                      {busyId === trip.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === "active" && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    disabled={busyId === trip.id}
                    onPress={() => handleComplete(trip)}
                  >
                    {busyId === trip.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.completeBtnText}>Mark as Completed</Text>
                    )}
                  </TouchableOpacity>
                )}

                {activeTab === "completed" && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✅ Completed</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

        

      {showAcceptModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, styles.acceptModalIcon]}>
              <Text style={styles.modalIconText}>✅</Text>
            </View>

            <Text style={styles.modalTitle}>
              Accept Trip?
            </Text>

            <Text style={styles.modalMessage}>
              Passenger: {selectedTrip?.passengerName}
              {"\n"}
              Pickup: {selectedTrip?.pickup}
              {"\n"}
              Fare: ₹{selectedTrip?.fare}
              {"\n\n"}
              This trip will be moved to the Active tab.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAcceptModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalAcceptBtn}
                onPress={confirmAccept}
              >
                <Text style={styles.modalConfirmText}>
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showDeclineModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, styles.declineModalIcon]}>
              <Text style={styles.modalIconText}>❌</Text>
            </View>

            <Text style={styles.modalTitle}>
              Decline Trip?
            </Text>

            <Text style={styles.modalMessage}>
              Passenger: {selectedTrip?.passengerName}
              {"\n"}
              Pickup: {selectedTrip?.pickup}
              {"\n"}
              Fare: ₹{selectedTrip?.fare}
              {"\n\n"}
              This request will be removed from Pending Trips.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDeclineModal(false)}
              >
                <Text style={styles.modalCancelText}>
                  Keep Trip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeclineBtn}
                onPress={confirmDecline}
              >
                <Text style={styles.modalConfirmText}>
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>

    // </View>
  );
}

// ── Styles ───────────────────────────────────────────────
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A2B25" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    padding: 5,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#0EA571" },
  tabText: { color: "#6B7B76", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#FFFFFF" },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  list: { flex: 1, marginTop: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  passengerName: { fontSize: 16, fontWeight: "600", color: "#1A2B25" },
  fareBadge: {
    backgroundColor: "rgba(14,165,113,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  fareText: { color: "#0EA571", fontWeight: "700", fontSize: 14 },

  routeRow: { flexDirection: "row", marginBottom: 12 },
  routeCol: { flex: 1 },
  routeLabel: { fontSize: 10, color: "#6B7B76", fontWeight: "600", marginBottom: 2 },
  routeValue: { fontSize: 13, color: "#1A2B25", fontWeight: "500" },
  routeTime: { fontSize: 12, color: "#0EA571", marginTop: 2 },

  metaRow: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E4E9E8",
    marginBottom: 12,
  },
  metaText: { fontSize: 12, color: "#6B7B76" },

  actionRow: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  declineBtnText: { color: "#E05C5C", fontWeight: "600" },
  acceptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#0EA571",
  },
  acceptBtnText: { color: "#FFFFFF", fontWeight: "700" },

  completeBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#0EA571",
  },
  completeBtnText: { color: "#FFFFFF", fontWeight: "700" },

  completedBadge: { alignItems: "center" },
  completedBadgeText: { color: "#0EA571", fontWeight: "600" },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 18,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#1A2B25", marginBottom: 6 },
  emptyText: { fontSize: 12, color: "#6B7B76", textAlign: "center" },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 999,
  },

  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  modalIcon: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  acceptModalIcon: {
    backgroundColor: "rgba(14,165,113,0.12)",
  },

  declineModalIcon: {
    backgroundColor: "rgba(224,92,92,0.12)",
  },

  modalIconText: {
    fontSize: 28,
  },

  modalTitle: {
    color: "#1A2B25",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  modalMessage: {
    color: "#6B7B76",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },

  modalButtons: {
    flexDirection: "row",
    width: "100%",
    marginTop: 24,
  },

  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 8,
  },

  modalAcceptBtn: {
    flex: 1,
    backgroundColor: "#0EA571",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalDeclineBtn: {
    flex: 1,
    backgroundColor: "#E05C5C",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCancelText: {
    color: "#1A2B25",
    fontSize: 14,
    fontWeight: "600",
  },

  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});