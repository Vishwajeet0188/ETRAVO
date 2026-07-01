import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function SOS() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.icon}>🆘</Text>
        <Text style={styles.title}> You Can Get Help From Here </Text>
        <Text style={styles.subtitle}>
          In case of an emergency, use the SOS feature to quickly contact
          support and share your location.
        </Text>
        <Text style={styles.imp}>
          Imp Note: This functionality is not being implemented fully, Hang on
          we are working!
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
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: { fontSize: 60, marginBottom: 15 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#d32f2f",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
  },
  imp: { fontSize: 20, textAlign: "center", marginTop: 10 },
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
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},

backIcon: {
  fontSize: 24,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 7
},
});
