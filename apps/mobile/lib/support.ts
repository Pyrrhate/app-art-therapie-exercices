import { Linking, Platform } from "react-native";
import Constants from "expo-constants";
import { showAlert } from "@/lib/alert";

export function getSupportUrl(): string | null {
  const url =
    process.env.EXPO_PUBLIC_SUPPORT_URL ??
    Constants.expoConfig?.extra?.supportUrl ??
    null;
  if (!url || typeof url !== "string") return null;
  return url.trim() || null;
}

export async function openSupportUrl(): Promise<void> {
  const url = getSupportUrl();
  if (!url) {
    showAlert(
      "Soutien",
      "La page de soutien n'est pas encore configurée. Ajoutez EXPO_PUBLIC_SUPPORT_URL dans la configuration de l'application."
    );
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error("URL non supportée");
    }
    await Linking.openURL(url);
  } catch {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    showAlert(
      "Impossible d'ouvrir le lien",
      "Vérifiez l'URL de soutien dans la configuration."
    );
  }
}
