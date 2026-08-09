import Constants from "expo-constants";
import { Platform } from "react-native";

/** API de production — utilisée dès que l'API locale n'est pas explicitement demandée. */
export const PRODUCTION_API_URL = "https://api.pastek-art.eu";

/** Corrige l'URL marketing (SPA) vers le sous-domaine API. */
export function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (/^https?:\/\/(www\.)?pastek-art\.eu$/i.test(trimmed)) {
    return PRODUCTION_API_URL;
  }
  return trimmed;
}

export function getApiUrl(): string {
  const configured = normalizeApiUrl(
    process.env.EXPO_PUBLIC_API_URL ??
      Constants.expoConfig?.extra?.apiUrl ??
      PRODUCTION_API_URL
  );

  // Web en dev : requêtes same-origin → proxy Metro (contourne CORS)
  if (Platform.OS === "web" && __DEV__) {
    return "";
  }

  return configured;
}
