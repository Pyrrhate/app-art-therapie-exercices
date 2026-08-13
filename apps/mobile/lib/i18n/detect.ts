import { Platform } from "react-native";
import type { AppLanguage } from "./types";
import { isAppLanguage } from "./types";

/** Détection initiale (navigateur / OS) — FR par défaut. */
export function detectDeviceLanguage(): AppLanguage {
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      const raw = (navigator.language || navigator.languages?.[0] || "")
        .toLowerCase()
        .trim();
      if (raw.startsWith("en")) return "en";
      return "fr";
    }
  } catch {
    /* ignore */
  }
  return "fr";
}

export function resolveInitialLanguage(
  stored: string | null | undefined
): AppLanguage {
  if (isAppLanguage(stored)) return stored;
  return detectDeviceLanguage();
}
