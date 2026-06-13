import Constants from "expo-constants";
import { Platform } from "react-native";

export function getApiUrl(): string {
  const configured =
    process.env.EXPO_PUBLIC_API_URL ??
    Constants.expoConfig?.extra?.apiUrl ??
    "http://localhost:3000";

  // Web en dev : requêtes same-origin → proxy Metro (contourne CORS)
  if (Platform.OS === "web" && __DEV__) {
    return "";
  }

  return configured.replace(/\/$/, "");
}