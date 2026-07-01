import React, { useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { Icon, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";  

const { width, height } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────
type Driver = {
  name: string;
  initials: string;
  id: string;
  email: string;
  phone: string;
};

type TripRequest = {
  id: string;
  passengerName: string;
  passengerInitials: string;
  pickup: string;
  dropoff: string;
  pickupTime: string;
  dropoffTime: string;
  fare: number;
  distance: string;
  seats: number;
  status: "pending" | "accepted" | "declined" | "completed";
  timestamp: Date;
};

type Activity = {
  id: string;
  title: string;
  amount?: string;
  time: string;
  icon: string;
  isNew?: boolean;
};
type DashboardResponse = {
  stats: {
    totalEarnings: number;
    todayEarnings: number;
    completedTrips: number;
    rating: string;
  };
  activities: {
    id: string;
    title: string;
    amount: string;
    created_at: string;
  }[];
};


// ── fetch for recent activities ──
async function fetchDashboard(token: string): Promise<DashboardResponse> {
  const response = await fetch(
    // "http://localhost:4000/api/dashboard",
    `${BASE_URL}/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return response.json();
}

async function fetchAvailableTrips(token: string) {
  const response = await fetch(
    // "http://localhost:4000/api/dashboard/available-trips",
    `${BASE_URL}/dashboard/available-trips`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch trips");
  }

  return response.json();
}

// ── Helper function for greeting ──
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "🌅";
  if (hour < 17) return "☀️";
  return "🌙";
};

// ── Main Component ──
export default function DriverDashboard() {
  const { user, token } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripRequest | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptedTrip, setAcceptedTrip] = useState<TripRequest | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalEarnings: 0,
    todayEarnings: 0,
    completedTrips: 0,
    rating: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
  try {
    const [tripsResponse, dashboardData] = await Promise.all([
      fetchAvailableTrips(token || ""),
      fetchDashboard(token || ""),
    ]);

    setDriver({
      name: user?.name || "Driver",
      initials:
        user?.name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() || "D",
      id: user?.id || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });

    setTripRequests(
      tripsResponse.trips.map((trip: any) => ({
        id: String(trip.id),
        passengerName: `Passenger #${trip.passenger_id}`,
        passengerInitials: "P",
        pickup: trip.pickup_location,
        dropoff: trip.destination_location,
        pickupTime: trip.pickup_time,
        dropoffTime: "TBD",
        fare: Number(trip.fare || 0),
        distance: trip.distance || "N/A",
        seats: trip.seats || 1,
        status: trip.status,
        timestamp: new Date(trip.created_at),
      }))
    );

    setStats({
      totalEarnings: dashboardData.stats.totalEarnings,
      todayEarnings: dashboardData.stats.todayEarnings,
      completedTrips: dashboardData.stats.completedTrips,
      rating: Number(dashboardData.stats.rating),
    });

    setRecentActivities(
      dashboardData.activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        amount: `₹${activity.amount}`,
        time: new Date(activity.created_at).toLocaleDateString(),
        icon: "✅",
        isNew: false,
      }))
    );

    setLoading(false);
  } catch (error) {
    console.error("Dashboard load failed:", error);
    setLoading(false);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleAcceptClick = (trip: TripRequest) => {
    setSelectedTrip(trip);
    setShowAcceptModal(true);
  };

  const confirmAccept = () => {
    if (selectedTrip) {
      if (acceptedTrip) {
        Alert.alert(
          "Already have an active trip",
          `You have already accepted a trip with ${acceptedTrip.passengerName}. Please complete that trip before accepting another.`,
          [{ text: "OK" }]
        );
        setShowAcceptModal(false);
        setSelectedTrip(null);
        return;
      }
      
      setAcceptedTrip(selectedTrip);
      setTripRequests(prev => 
        prev.map(t => 
          t.id === selectedTrip.id 
            ? { ...t, status: "accepted" }
            : t
        )
      );
      
      setShowAcceptModal(false);
      
      Alert.alert(
        "Trip Accepted! 🎉",
        `You have accepted the trip with ${selectedTrip.passengerName}. Pickup at ${selectedTrip.pickupTime}`,
        [{ text: "OK" }]
      );
      setSelectedTrip(null);
    }
  };

  const handleCompleteTrip = () => {
    if (acceptedTrip) {
      // Add fare to earnings
      const fareAmount = acceptedTrip.fare;
      setStats(prev => ({
        ...prev,
        todayEarnings: prev.todayEarnings + fareAmount,
        totalEarnings: prev.totalEarnings + fareAmount,
        completedTrips: prev.completedTrips + 1,
      }));
      
      // Add to recent activities
      const newActivity: Activity = {
        id: Date.now().toString(),
        title: `Trip completed to ${acceptedTrip.dropoff}`,
        amount: `+₹${fareAmount}`,
        time: "Just now",
        icon: "✅",
        isNew: true,
      };
      setRecentActivities(prev => [newActivity, ...prev]);
      
      // Mark trip as completed
      setTripRequests(prev => 
        prev.map(t => 
          t.id === acceptedTrip.id 
            ? { ...t, status: "completed" }
            : t
        )
      );
      
      Alert.alert(
        "Trip Completed! 🎉",
        `You earned ₹${fareAmount} for this trip. Total today: ₹${stats.todayEarnings + fareAmount}`,
        [{ text: "OK" }]
      );
      
      setAcceptedTrip(null);
    }
  };

  const handleDeclineClick = (trip: TripRequest) => {
    setSelectedTrip(trip);
    setShowDeclineModal(true);
  };

  const confirmDecline = () => {
    if (selectedTrip) {
      setTripRequests(prev => 
        prev.map(t => 
          t.id === selectedTrip.id 
            ? { ...t, status: "declined" }
            : t
        )
      );
      setShowDeclineModal(false);
      setSelectedTrip(null);
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((new Date().getTime() - timestamp.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  const pendingTrips = tripRequests.filter(trip => trip.status === "pending");
  const greeting = getGreeting();
  const greetingEmoji = getGreetingEmoji();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Centered Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greetingEmoji}>{greetingEmoji}</Text>
          <Text style={styles.greeting}>{greeting}👋</Text>
          <Text style={styles.driverName}>{driver?.name?.split(" ")[0]}!</Text>
          <View style={styles.statusBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Available for trips</Text>
          </View>
        </View>

        
        
        <TouchableOpacity 
          style={styles.profileCircle}
          onPress={() => router.push("/(driver)/profile" as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.profileInitials}>{driver?.initials}</Text>
        </TouchableOpacity>

        

      </View>

      <View style={styles.topNav}>
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "trips", label: "Trips" },
          { id: "attendance", label: "Attendance" },
          { id: "leave", label: "Leave" },
          { id: "profile", label: "Profile" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.navTab,
              activeTab === tab.id && styles.navTabActive,
            ]}
            onPress={() => {
              if (tab.id === "profile") {
                router.push("/(driver)/profile" as any);
              } 
              if(tab.id === "dashboard"){
                router.push("/(driver)/dashboard" as any); 
              }
              if(tab.id === "trips"){
                router.push("/(driver)/trips" as any);
              }
              if(tab.id === "leave"){
                router.push("/(driver)/leave" as any);
              }
              if(tab.id === "attendance"){
                router.push("/(driver)/attendance" as any);
              }
              else {
                setActiveTab(tab.id);
              }
            }}
          >
            <Text
              style={[
                styles.navTabText,
                activeTab === tab.id && styles.navTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Simplified Stats Cards - Horizontal Scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{stats.todayEarnings}</Text>
          <Text style={styles.statLabel}>Today Earning</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedTrips}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{stats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Total Earning</Text>
        </View>
      </ScrollView>

      {/* Active Trip Banner */}
      {acceptedTrip && (
        <View style={styles.activeTripBanner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerIcon}>🚗</Text>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>Active Trip</Text>
              <Text style={styles.bannerText}>
                {acceptedTrip.pickup} → {acceptedTrip.dropoff}
              </Text>
              <Text style={styles.bannerTime}>Pickup at {acceptedTrip.pickupTime}</Text>
            </View>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={handleCompleteTrip}
            >
              <Text style={styles.bannerButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Trip Requests Section */}
      <View style={styles.tripsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🚗 Available Rides ({pendingTrips.length})
          </Text>
          {pendingTrips.length > 0 && !acceptedTrip && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {pendingTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🚕</Text>
            <Text style={styles.emptyTitle}>No pending trips</Text>
            <Text style={styles.emptyText}>New trip requests will appear here</Text>
          </View>
        ) : (
          pendingTrips.map((trip) => (
            <View key={trip.id} style={[
              styles.tripCard,
              acceptedTrip && styles.tripCardDisabled
            ]}>
              <View style={styles.tripHeader}>
                <View style={styles.passengerInfo}>
                  <View style={styles.passengerAvatar}>
                    <Text style={styles.passengerInitials}>
                      {trip.passengerInitials}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.passengerName}>{trip.passengerName}</Text>
                    <Text style={styles.requestTime}>
                      Requested {getTimeAgo(trip.timestamp)}
                    </Text>
                  </View>
                </View>
                <View style={styles.fareBadge}>
                  <Text style={styles.fareText}>₹{trip.fare}</Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeTimeline}>
                  <View style={[styles.timelineDot, styles.pickupDot]} />
                  <View style={styles.timelineLine} />
                  <View style={[styles.timelineDot, styles.dropoffDot]} />
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>Pickup</Text>
                    <Text style={styles.routeAddress}>{trip.pickup}</Text>
                    <Text style={styles.routeTime}>{trip.pickupTime}</Text>
                  </View>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>Dropoff</Text>
                    <Text style={styles.routeAddress}>{trip.dropoff}</Text>
                    <Text style={styles.routeTime}>{trip.dropoffTime}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tripMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📏</Text>
                  <Text style={styles.metaText}>{trip.distance} Total Distance</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>👥</Text>
                  <Text style={styles.metaText}>{trip.seats} Seats Required</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏱️</Text>
                  <Text style={styles.metaText}>Est. Time 45 min</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.declineBtn, acceptedTrip && styles.buttonDisabled]}
                  onPress={() => handleDeclineClick(trip)}
                  disabled={!!acceptedTrip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptBtn, acceptedTrip && styles.buttonDisabled]}
                  onPress={() => handleAcceptClick(trip)}
                  disabled={!!acceptedTrip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent Activity Section */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {recentActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{activity.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                <View style={[
                  styles.activityAmount,
                  activity.isNew && styles.activityAmountNew
                ]}>
                  <Text style={[
                    styles.activityAmountText,
                    activity.isNew && styles.activityAmountTextNew
                  ]}>
                    {activity.amount}
                  </Text>
                </View>
              </View>
              {index < recentActivities.length - 1 && <View style={styles.activityDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            // { icon: "📊", label: "History", route: "/(driver)/history" },
            // { icon: "🏆", label: "Achievements", route: "/(driver)/achievements" },
            { icon: "⚙️", label: "Settings", route: "/(driver)/profile" },
            { icon: "🆘", label: "SOS", route: "/(driver)/sos" }
            
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

      {/* Accept Confirmation Modal */}
      <Modal
        visible={showAcceptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAcceptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIcon, styles.acceptModalIcon]}>
              <Text style={styles.modalIconText}>✅</Text>
            </View>
            <Text style={styles.modalTitle}>Accept Trip?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to accept the trip with {selectedTrip?.passengerName}?
              {'\n\n'}Pickup: {selectedTrip?.pickup}{'\n'}Fare: ₹{selectedTrip?.fare}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAcceptModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAcceptBtn}
                onPress={confirmAccept}
              >
                <Text style={styles.modalConfirmText}>Yes, Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Decline Confirmation Modal */}
      <Modal
        visible={showDeclineModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>Decline Trip?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to decline the trip with {selectedTrip?.passengerName}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDeclineModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmDecline}
              >
                <Text style={styles.modalConfirmText}>Yes, Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Styles (Responsive with Blueish Background) ──
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

  // Header - Centered with profile on right
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
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  greetingEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 25,
    color: "#5B6B66",
    fontWeight: "500",
  },
  driverName: {
    fontSize: width > 400 ? 26 : 22,
    fontWeight: "700",
    color: "#1A2B25",
    marginTop: 5,
  },
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
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0EA571",
  },
  statusText: {
    fontSize: 13,
    color: "#0EA571",
    fontWeight: "500",
  },
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
  profileInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  // Simplified Stats
  statsScroll: {
    flexGrow: 0,
    marginTop: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
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
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7B76",
    fontWeight: "500",
  },

  // Active Trip Banner
  activeTripBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "rgba(14,165,113,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#0EA571",
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  bannerIcon: {
    fontSize: 28,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0EA571",
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A2B25",
    marginBottom: 2,
  },
  bannerTime: {
    fontSize: 11,
    color: "#0EA571",
  },
  bannerButton: {
    backgroundColor: "#0EA571",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Trips Section
  tripsSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B25",
  },
  viewAllText: {
    fontSize: 12,
    color: "#0EA571",
    fontWeight: "500",
  },
  newBadge: {
    backgroundColor: "#E05C5C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // Trip Card
  tripCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tripCardDisabled: {
    opacity: 0.5,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerInitials: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0EA571",
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2B25",
  },
  requestTime: {
    fontSize: 11,
    color: "#6B7B76",
    marginTop: 2,
  },
  fareBadge: {
    backgroundColor: "rgba(14,165,113,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fareText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0EA571",
  },

  // Route
  routeContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  routeTimeline: {
    alignItems: "center",
    marginRight: 12,
    width: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pickupDot: {
    backgroundColor: "#0EA571",
  },
  dropoffDot: {
    backgroundColor: "#E05C5C",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E4E9E8",
    marginVertical: 4,
  },
  routeDetails: {
    flex: 1,
    gap: 12,
  },
  routePoint: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7B76",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A2B25",
    marginBottom: 2,
  },
  routeTime: {
    fontSize: 12,
    color: "#0EA571",
    fontWeight: "500",
  },

  // Trip Meta
  tripMeta: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E4E9E8",
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7B76",
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E4E9E8",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  declineBtn: {
    width: 90,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  declineBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E05C5C",
  },
  acceptBtn: {
    width: 90,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0EA571",
  },
  acceptBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Recent Activity Section
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F7F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A2B25",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: "#6B7B76",
  },
  activityAmount: {
    backgroundColor: "rgba(14,165,113,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityAmountNew: {
    backgroundColor: "#E05C5C",
  },
  activityAmountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0EA571",
  },
  activityAmountTextNew: {
    color: "#FFFFFF",
  },
  activityDivider: {
    height: 1,
    backgroundColor: "#E4E9E8",
    marginVertical: 4,
  },

  // Empty State
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2B25",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7B76",
    textAlign: "center",
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
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
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7B76",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    maxWidth: 340,
    alignItems: "center",
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  acceptModalIcon: {
    backgroundColor: "rgba(14,165,113,0.12)",
  },
  modalIconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2B25",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#6B7B76",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    borderWidth: 1,
    borderColor: "#E4E9E8",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7B76",
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#E05C5C",
  },
  modalAcceptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#0EA571",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  topNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E9E8",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },

  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    minHeight: 48,
  },

  navTabActive: {
    backgroundColor: "#0EA571",
  },

  navTabText: {
    color: "#6B7B76",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },

  navTabTextActive: {
    color: "#FFFFFF",
  },
});