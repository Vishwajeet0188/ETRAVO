import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:4000/api"
    : "http://localhost:4000/api";

type Trip = {
  id: number;
  pickup_location: string;
  destination_location: string;
  pickup_time: string;
  fare: number;
  seats: number;
  status: string;
  completed_at: string;
  driver_name: string;
  rating: number | null;
};

export default function History() {
  const { token } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/passenger/trips/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load history");
      }

      const data = await response.json();

      setTrips(data.trips || []);
    } catch (error) {
      console.log("History Error:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#0EA571"
        />
        <Text style={styles.loadingText}>
          Loading Ride History...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backIcon}>
          ←
        </Text>
      </TouchableOpacity>

      <Text style={styles.heading}>
        Ride History
      </Text>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>

            <Text style={styles.location}>
              📍 {item.pickup_location}
            </Text>

            <Text style={styles.arrow}>
              ↓
            </Text>

            <Text style={styles.location}>
              📍 {item.destination_location}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Driver</Text>
              <Text style={styles.value}>
                {item.driver_name || "Not Assigned"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Fare</Text>
              <Text style={styles.value}>
                ₹{item.fare}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Seats</Text>
              <Text style={styles.value}>
                {item.seats}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Status</Text>

              <Text
                style={{
                  color: "#0EA571",
                  fontWeight: "700",
                }}
              >
                Completed
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Completed On</Text>

              <Text style={styles.value}>
                {new Date(item.completed_at).toLocaleString()}
              </Text>
            </View>

          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              🚕
            </Text>

            <Text style={styles.emptyTitle}>
              No Completed Trips
            </Text>

            <Text style={styles.emptySubtitle}>
              Your completed rides will appear here.
            </Text>
          </View>
        }
      />

    </View>
  );
}

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
    fontSize: 15,
    color: "#666",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 3,
  },

  backIcon: {
    fontSize: 24,
    color: "#0EA571",
    fontWeight: "700",
    marginBottom: 7
  },

  heading: {
    marginTop: 60,
    marginBottom: 20,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A2B25",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 120,
    paddingHorizontal: 30,
  },

  emptyEmoji: {
    fontSize: 70,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2B25",
  },

  emptySubtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#777",
    textAlign: "center",
  },
card: {
  backgroundColor: "#FFFFFF",
  marginHorizontal: 20,
  marginBottom: 15,
  borderRadius: 18,
  padding: 18,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  elevation: 3,
},

location: {
  fontSize: 17,
  fontWeight: "700",
  color: "#1A2B25",
},

arrow: {
  textAlign: "center",
  fontSize: 20,
  marginVertical: 8,
  color: "#0EA571",
},

infoRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 10,
},

label: {
  fontWeight: "600",
  color: "#666",
},

value: {
  fontWeight: "700",
  color: "#1A2B25",
},
});