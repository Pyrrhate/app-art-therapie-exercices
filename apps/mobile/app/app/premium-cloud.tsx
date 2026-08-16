import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import { ROUTES } from "@/lib/routes";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/**
 * Sauvegarde personnelle — Google Drive + Infomaniak kDrive (local-first).
 * Plus de compte Pastek / OAuth serveur.
 */
export default function PremiumCloudScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const params = useLocalSearchParams<{ connected?: string; code?: string }>();

  useEffect(() => {
    if (params.connected === "google_drive" || params.code) {
      showAlert(
        t("premiumCloud.driveAlertTitle"),
        t("premiumCloud.driveAlertBody")
      );
    }
  }, [params.connected, params.code, t]);

  return (
    <ScreenContainer scrollable compactTop>
      <ScreenNavBar
        backLabel={t("nav.backSettings")}
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label={t("premiumCloud.heroLabel")}
        title={t("premiumCloud.heroTitle")}
        accent={t("premiumCloud.heroAccent")}
        description={t("premiumCloud.heroDescription")}
        className="mb-6"
      />

      <Text className={`text-xs leading-5 px-1 mb-4 ${textMuted(isDark)}`}>
        {t("premiumCloud.photosHint")}
      </Text>

      <StorageSettings />

      <View className="mt-6 px-1">
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("premiumCloud.roadmap")}
        </Text>
      </View>
    </ScreenContainer>
  );
}
