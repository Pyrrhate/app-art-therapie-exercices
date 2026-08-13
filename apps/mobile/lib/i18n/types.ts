export type AppLanguage = "fr" | "en";

/** Texte disponible dans chaque langue de l'interface. */
export type LocalizedText = Record<AppLanguage, string>;

export const APP_LANGUAGES: AppLanguage[] = ["fr", "en"];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  fr: "FR",
  en: "EN",
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "fr" || value === "en";
}
