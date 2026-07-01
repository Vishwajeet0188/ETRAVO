import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function PaymentHistory() {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.icon}>💳</Text>

        <Text style={styles.title}>
          Payment History
        </Text>

        <Text style={styles.subtitle}>
          You will be able to view all your payment transactions,
          ride payments, refunds, and earnings history here.
        </Text>

        <Text style={styles.note}>
          🚧 We're working on this feature.
        </Text>

        <Text style={styles.smallText}>
          This functionality will be available in a future update.
          Thank you for your patience.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7F6",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E9E8",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  icon: {
    fontSize: 60,
    marginBottom: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1A2B25",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7B76",
    lineHeight: 24,
    marginBottom: 20,
  },

  note: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#F59E0B",
    marginBottom: 10,
  },

  smallText: {
    fontSize: 14,
    textAlign: "center",
    color: "#9AA8A4",
    lineHeight: 22,
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
    borderWidth: 1,
    borderColor: "#E4E9E8",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  backIcon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0EA571",
    marginBottom: 8
  },
});