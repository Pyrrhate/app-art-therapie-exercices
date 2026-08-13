import { Platform } from "react-native";
import type { AppLanguage } from "./types";

/** Met à jour lang HTML + attributs utiles côté web. */
export function syncDocumentLanguage(language: AppLanguage): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.documentElement.lang = language;
}
