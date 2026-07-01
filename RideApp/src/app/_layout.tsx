import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

console.log("ROOT LAYOUT LOADED");

export default function RootLayout() {
  console.log("ROOT LAYOUT RENDER");

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}