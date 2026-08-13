import { Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ROUTES } from "@/lib/routes";
import { textPrimary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/** Raccourci vers les réglages (sauvegarde Drive) — plus de login compte. */
export function AuthNavButton({ compact = true }: { compact?: boolean }) {
  const { t } = useTranslation("app");
  const isDark = useIsDark();

  return (
    <Pressable
      onPress={() => router.push(ROUTES.settings)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("auth.navSettingsA11y")}
      className={`rounded-full border px-3 py-1.5 ${
        isDark
          ? "border-sand-600 bg-sand-800/80"
          : "border-sage-200 bg-sage-50"
      }`}
    >
      <Text
        className={`text-sm font-medium ${textPrimary(isDark)}`}
        numberOfLines={1}
      >
        {compact ? t("auth.navSettings") : t("auth.navBackup")}
      </Text>
    </Pressable>
  );
}
