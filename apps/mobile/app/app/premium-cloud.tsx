import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CloudProviderToggle } from "@/components/integrations/CloudProviderToggle";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import { useIsAuthenticated } from "@/lib/auth/store";
import {
  connectCloudProvider,
  disconnectCloudProvider,
  fetchCloudIntegrationStatus,
  type CloudIntegrationStatus,
  type CloudProviderId,
} from "@/lib/integrations/cloud";
import { ROUTES } from "@/lib/routes";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function PremiumCloudScreen() {
  const isDark = useIsDark();
  const isAuthenticated = useIsAuthenticated();
  const params = useLocalSearchParams<{ connected?: string }>();

  const [googleStatus, setGoogleStatus] =
    useState<CloudIntegrationStatus | null>(null);
  const [onedriveStatus, setOnedriveStatus] =
    useState<CloudIntegrationStatus | null>(null);
  const [loadingProvider, setLoadingProvider] =
    useState<CloudProviderId | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    const [google, onedrive] = await Promise.all([
      fetchCloudIntegrationStatus("google_drive"),
      fetchCloudIntegrationStatus("onedrive"),
    ]);
    setGoogleStatus(google);
    setOnedriveStatus(onedrive);
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void load();
      if (params.connected === "google_drive") {
        showAlert("Google Drive", "Connexion enregistrée.");
      }
      if (params.connected === "onedrive") {
        showAlert("OneDrive", "Connexion enregistrée.");
      }
    }, [load, params.connected])
  );

  async function handleConnect(provider: CloudProviderId) {
    setLoadingProvider(provider);
    try {
      await connectCloudProvider(provider);
      await load();
    } catch (error) {
      showAlert(
        "Connexion",
        error instanceof Error ? error.message : "Impossible de connecter."
      );
    } finally {
      setLoadingProvider(null);
    }
  }

  async function handleDisconnect(provider: CloudProviderId) {
    setLoadingProvider(provider);
    try {
      await disconnectCloudProvider(provider);
      await load();
    } catch (error) {
      showAlert(
        "Déconnexion",
        error instanceof Error ? error.message : "Impossible de déconnecter."
      );
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <ScreenContainer scrollable compactTop>
      <ScreenNavBar
        backLabel="← Réglages"
        onBack={() => router.push(ROUTES.settings)}
      />

      <PastekScreenHero
        label="Compte"
        title="Sauvegarde "
        accent="personnelle"
        description="Vos photos d'œuvres sont copiées dans votre Google Drive ou OneDrive — Pastek Art n'héberge pas vos images lourdes."
        className="mb-6"
      />

      {!isAuthenticated ? (
        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
            Créez un compte gratuit dans Réglages pour connecter votre cloud
            personnel et sauvegarder automatiquement vos œuvres.
          </Text>
          <View className="mt-4">
            <PrimaryButton
              label="Aller aux Réglages"
              onPress={() => router.push(ROUTES.settings)}
            />
          </View>
        </View>
      ) : (
        <View className="gap-4 pb-8">
          <Text className={`text-xs leading-5 px-1 ${textMuted(isDark)}`}>
            Après un exercice avec photo, le fichier est copié dans le dossier
            « Pastek Art » de votre Drive. Les métadonnées du Fil restent sur
            Pastek Art.
          </Text>

          <CloudProviderToggle
            title="Google Drive"
            description="Photos d'œuvres dans le dossier « Pastek Art » (accès limité aux fichiers créés par l'app)."
            status={googleStatus}
            loading={loadingProvider === "google_drive"}
            onConnect={() => void handleConnect("google_drive")}
            onDisconnect={() => void handleDisconnect("google_drive")}
          />

          <CloudProviderToggle
            title="Microsoft OneDrive"
            description="Même principe pour votre espace Microsoft personnel."
            status={onedriveStatus}
            loading={loadingProvider === "onedrive"}
            onConnect={() => void handleConnect("onedrive")}
            onDisconnect={() => void handleDisconnect("onedrive")}
          />
        </View>
      )}
    </ScreenContainer>
  );
}
