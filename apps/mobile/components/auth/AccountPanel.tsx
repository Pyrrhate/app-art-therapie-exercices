import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { panelBg, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/**
 * Remplace l'ancien panneau compte Supabase : Pastek est local-first.
 */
export function AccountPanel({ className = "" }: { className?: string }) {
  const isDark = useIsDark();
  const { t } = useTranslation("app");

  return (
    <View className={`gap-3 ${className}`}>
      <View className={`rounded-3xl border px-5 py-5 gap-3 ${panelBg(isDark)}`}>
        <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
          {t("settings.accountLabel")}
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("settings.accountBody")}
        </Text>
      </View>
      <StorageSettings />
    </View>
  );
}
