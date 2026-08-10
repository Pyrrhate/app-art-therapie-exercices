import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { PrimaryButton } from "@/components/ui/Button";
import { showAlert } from "@/lib/alert";
import { formatSessionDate } from "@/constants";
import {
  backupLocalDataToGoogleDrive,
  connectGoogleDrive,
  disconnectGoogleDrive,
  getGoogleDriveConnectionStatus,
  isGoogleDriveClientConfigured,
  restoreLocalDataFromGoogleDrive,
} from "@/lib/storage/googleDriveAdapter";
import type { GoogleDriveMeta } from "@/lib/storage/googleDriveTokens";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

/**
 * Sauvegarde locale ↔ Google Drive (local-first, sans compte Pastek).
 */
export function StorageSettings({ className = "" }: { className?: string }) {
  const isDark = useIsDark();
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(isGoogleDriveClientConfigured());
  const [meta, setMeta] = useState<GoogleDriveMeta | null>(null);
  const [busy, setBusy] = useState<"connect" | "disconnect" | "backup" | "restore" | null>(null);

  const refresh = useCallback(async () => {
    const status = await getGoogleDriveConnectionStatus();
    setConfigured(status.configured);
    setConnected(status.connected);
    setMeta(status.meta);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function handleConnect() {
    setBusy("connect");
    try {
      await connectGoogleDrive();
      await refresh();
      showAlert(
        "Google Drive connecté",
        "Vos données restent sur cet appareil. Vous pouvez sauvegarder ou restaurer quand vous voulez."
      );
    } catch (error) {
      showAlert(
        "Connexion Drive",
        error instanceof Error ? error.message : "Impossible de connecter."
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    setBusy("disconnect");
    try {
      await disconnectGoogleDrive();
      await refresh();
      showAlert("Déconnecté", "Mode local uniquement — aucune donnée n'a été effacée ici.");
    } catch (error) {
      showAlert(
        "Déconnexion",
        error instanceof Error ? error.message : "Impossible de déconnecter."
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleBackup() {
    setBusy("backup");
    try {
      const result = await backupLocalDataToGoogleDrive();
      await refresh();
      showAlert(
        "Sauvegarde envoyée",
        `${result.filCount} trace${result.filCount > 1 ? "s" : ""} dans le dossier « Pastek Art » sur Drive.`
      );
    } catch (error) {
      showAlert(
        "Sauvegarde",
        error instanceof Error ? error.message : "Échec de la sauvegarde."
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    setBusy("restore");
    try {
      const result = await restoreLocalDataFromGoogleDrive();
      await refresh();
      showAlert(
        "Restauration terminée",
        `${result.filCount} trace${result.filCount > 1 ? "s" : ""} restaurée${result.filCount > 1 ? "s" : ""} (export du ${formatSessionDate(result.exportedAt)}).`
      );
    } catch (error) {
      showAlert(
        "Restauration",
        error instanceof Error ? error.message : "Échec de la restauration."
      );
    } finally {
      setBusy(null);
    }
  }

  const statusLabel = connected
    ? meta?.lastSyncAt
      ? `Connecté à Google Drive · Dernière sync : ${formatSessionDate(meta.lastSyncAt)}`
      : "Connecté à Google Drive (pas encore synchronisé)"
    : "Local uniquement (non synchronisé)";

  return (
    <View className={`rounded-3xl border px-5 py-5 gap-4 ${panelBg(isDark)} ${className}`}>
      <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
        Stockage
      </Text>
      <Text className={`font-medium ${textPrimary(isDark)}`}>
        Local-first · Google Drive optionnel
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        Par défaut, tout reste sur cet appareil. Connectez votre Drive pour une
        sauvegarde personnelle — sans compte Pastek, sans base serveur.
      </Text>

      <View
        className={`rounded-2xl px-4 py-3 ${
          isDark ? "bg-sand-900/60" : "bg-sage-50"
        }`}
      >
        <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
          {statusLabel}
        </Text>
        {connected && meta?.accountHint ? (
          <Text className={`text-xs mt-1 ${textMuted(isDark)}`}>
            {meta.accountHint}
          </Text>
        ) : null}
      </View>

      {!configured ? (
        <Text className="text-amber-700 text-xs leading-5">
          Ajoutez EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID au build web — le même Client
          ID Google que GOOGLE_DRIVE_CLIENT_ID sur l&apos;API (avec secret). URI
          de redirection : origine du site + /app/premium-cloud.
        </Text>
      ) : null}

      {busy ? <ActivityIndicator color="#496349" /> : null}

      {!connected ? (
        <PrimaryButton
          label={busy === "connect" ? "Connexion…" : "Connecter Google Drive"}
          onPress={() => void handleConnect()}
          disabled={!configured || busy !== null}
        />
      ) : (
        <View className="gap-3">
          <PrimaryButton
            label={busy === "backup" ? "Sauvegarde…" : "Sauvegarder vers Drive"}
            onPress={() => void handleBackup()}
            disabled={busy !== null}
          />
          <PrimaryButton
            label={busy === "restore" ? "Restauration…" : "Restaurer depuis Drive"}
            onPress={() => void handleRestore()}
            disabled={busy !== null}
            variant="secondary"
          />
          <PrimaryButton
            label={busy === "disconnect" ? "Déconnexion…" : "Déconnecter Google Drive"}
            onPress={() => void handleDisconnect()}
            disabled={busy !== null}
            variant="ghost"
          />
        </View>
      )}
    </View>
  );
}
