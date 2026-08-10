import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StorageSettings } from "@/components/settings/StorageSettings";
import { ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import { ROUTES } from "@/lib/routes";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/**
 * Sauvegarde personnelle — Google Drive côté appareil (local-first).
 * Plus de compte Pastek / OAuth serveur.
 */
export default function PremiumCloudScreen() {
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ connected?: string; code?: string }>();

  useEffect(() => {
    if (params.connected === "google_drive" || params.code) {
      showAlert(
        "Google Drive",
        "Si la connexion vient de se terminer, utilisez « Sauvegarder vers Drive » ci-dessous."
      );
    }
  }, [params.connected, params.code]);

  return (
    <ScreenContainer scrollable compactTop>
      <ScreenNavBar
        backLabel="← Réglages"
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label="Sauvegarde"
        title="Votre "
        accent="Drive"
        description="Connexion directe à votre Google Drive depuis cet appareil. Pastek ne stocke ni compte ni jetons."
        className="mb-6"
      />

      <Text className={`text-xs leading-5 px-1 mb-4 ${textMuted(isDark)}`}>
        Les photos d&apos;œuvres peuvent aussi être copiées dans le dossier
        « Pastek Art » après un rituel, si Drive est connecté.
      </Text>

      <StorageSettings />

      <View className="mt-6 px-1">
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          OneDrive, Infomaniak et Proton suivront le même modèle local-first.
        </Text>
      </View>
    </ScreenContainer>
  );
}
