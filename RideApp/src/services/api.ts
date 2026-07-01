import axios from "axios";
import { Platform } from "react-native";

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ?? `http://${defaultHost}:4000/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the server. Check that the backend is running.";
    }

    return error.response.data?.message ?? "Request failed";
  }

  return "Something went wrong";
}
