import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AISettings } from "@/components/settings/AISettings";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ROUTES } from "@/lib/routes";
import { textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function AiEnginesScreen() {
  const isDark = useIsDark();
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
        backLabel="← Réglages"
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label="Moteurs IA"
        title="Vos clés, "
        accent="votre confidentialité"
        description="Apportez votre propre clé API (BYOK). Elle reste sur l'appareil et n'est jamais stockée par Pastek Art."
        className="mb-6"
      />

      <View className="mb-4">
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          Sans clé personnelle, l&apos;app utilise le mode gratuit (Hugging Face)
          ou le secours local. Avec une clé, vous pilotez le modèle — Pastek Art
          ne fait que relayer la requête, sans conserver la clé.
        </Text>
      </View>

      <AISettings onRefreshReady={onRefreshReady} />
    </ScreenContainer>
  );
}
