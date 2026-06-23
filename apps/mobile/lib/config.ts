import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_URL = __DEV__
  ? "http://localhost:3000"
  : "https://api.pastek-art.eu";

/** Corrige l'URL marketing (SPA) vers le sous-domaine API. */
export function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (/^https?:\/\/(www\.)?pastek-art\.eu$/i.test(trimmed)) {
    return "https://api.pastek-art.eu";
  }
  return trimmed;
}

export function getApiUrl(): string {
  const configured = normalizeApiUrl(
    process.env.EXPO_PUBLIC_API_URL ??
      Constants.expoConfig?.extra?.apiUrl ??
      DEFAULT_API_URL
  );

  // Web en dev : requêtes same-origin → proxy Metro (contourne CORS)
  if (Platform.OS === "web" && __DEV__) {
    return "";
  }

  return configured;
}