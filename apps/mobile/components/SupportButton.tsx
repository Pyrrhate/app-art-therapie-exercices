import { Linking, Platform, Pressable, Text } from "react-native";
import Constants from "expo-constants";
import { showAlert } from "@/lib/alert";

interface SupportButtonProps {
  variant?: "compact" | "full";
}

function getSupportUrl(): string | null {
  const url =
    process.env.EXPO_PUBLIC_SUPPORT_URL ??
    Constants.expoConfig?.extra?.supportUrl ??
    null;
  if (!url || typeof url !== "string") return null;
  return url.trim() || null;
}

/**
 * Ouvre la page de soutien (Ko-fi, Buy Me a Coffee, Stripe Payment Link…).
 * Définir EXPO_PUBLIC_SUPPORT_URL dans apps/mobile/.env
 */
export function SupportButton({ variant = "full" }: SupportButtonProps) {
  async function handlePress() {
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

  if (variant === "compact") {
    return (
      <Pressable onPress={() => void handlePress()} className="py-2">
        <Text className="text-sage-500 text-sm text-center underline">
          Soutenir le projet ☕
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void handlePress()}
      className="bg-sand-100 border border-sand-200 rounded-2xl px-6 py-5 items-center"
    >
      <Text className="text-sand-700 text-base font-medium mb-1">
        Soutenir le projet
      </Text>
      <Text className="text-sand-500 text-sm text-center leading-5">
        Aidez à maintenir cette application gratuite et bienveillante.
      </Text>
    </Pressable>
  );
}
