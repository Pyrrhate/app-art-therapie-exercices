import i18n, { DEFAULT_LANGUAGE } from "@/lib/i18n";
import { isAppLanguage, type AppLanguage, type LocalizedText } from "./types";

export function currentLanguage(): AppLanguage {
  return isAppLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

export function pickLocalized(
  text: LocalizedText,
  language?: AppLanguage
): string {
  const lang = language ?? currentLanguage();
  return text[lang] ?? text.fr;
}
