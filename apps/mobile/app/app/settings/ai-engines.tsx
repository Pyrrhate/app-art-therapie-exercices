import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { AISettings } from "@/components/settings/AISettings";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ROUTES } from "@/lib/routes";
import { textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function AiEnginesScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const [refreshFn, setRefreshFn] = useState<
    (() => Promise<void>) | null
  >(null);

  const onRefreshReady = useCallback((fn: () => Promise<void>) => {
    setRefreshFn(() => fn);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshFn?.();
    }, [refreshFn])
  );

  return (
    <ScreenContainer
      scrollable
      refreshable
      onRefresh={async () => {
        await refreshFn?.();
      }}
      compactTop
    >
      <ScreenNavBar
        backLabel={t("nav.backSettings")}
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label={t("aiEngines.heroLabel")}
        title={t("aiEngines.heroTitle")}
        accent={t("aiEngines.heroAccent")}
        description={t("aiEngines.heroDescription")}
        className="mb-6"
      />

      <View className="mb-4">
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("aiEngines.intro")}
        </Text>
      </View>

      <AISettings onRefreshReady={onRefreshReady} />
    </ScreenContainer>
  );
}
