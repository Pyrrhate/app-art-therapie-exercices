import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { APP_LANGUAGES, LANGUAGE_LABELS } from "@/lib/i18n/types";
import type { AppLanguage } from "@/lib/i18n/types";
import { useLanguageStore } from "@/lib/i18n/languageStore";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

interface LanguageToggleProps {
  /** Compact for headers; expanded for settings. */
  variant?: "compact" | "settings";
}

export function LanguageToggle({ variant = "compact" }: LanguageToggleProps) {
  const { t } = useTranslation("common");
  const isDark = useIsDark();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  async function choose(next: AppLanguage) {
    if (next === language) return;
    await setLanguage(next);
  }

  if (variant === "settings") {
    return (
      <View className="gap-3">
        <Text className={`text-sm font-medium ${isDark ? "text-sand-200" : "text-sand-800"}`}>
          {t("language.label")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {APP_LANGUAGES.map((code) => {
            const active = language === code;
            return (
              <Pressable
                key={code}
                onPress={() => void choose(code)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(`language.${code}`)}
                className={`rounded-full px-4 py-2 border ${
                  active
                    ? "bg-sage-500 border-sage-500"
                    : isDark
                      ? "border-sand-600"
                      : "border-sand-200"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? "text-white" : textMuted(isDark)
                  }`}
                >
                  {t(`language.${code}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center self-start shrink-0 rounded-full border border-sand-200 bg-sand-50/90 overflow-hidden"
      accessibilityLabel={t("language.label")}
    >
      {APP_LANGUAGES.map((code) => {
        const active = language === code;
        return (
          <Pressable
            key={code}
            onPress={() => void choose(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t("language.switchTo", {
              lang: t(`language.${code}`),
            })}
            hitSlop={4}
            className={`px-2.5 py-1.5 min-h-[32px] justify-center shrink-0 ${
              active ? "bg-sage-500" : ""
            }`}
          >
            <Text
              className={`text-[11px] font-semibold tracking-wide ${
                active ? "text-white" : "text-sand-700"
              }`}
            >
              {LANGUAGE_LABELS[code]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
