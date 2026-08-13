import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { PrimaryButton } from "@/components/ui/Button";
import { showAlert } from "@/lib/alert";
import { formatSessionDate } from "@/constants";
import { useLanguageStore } from "@/lib/i18n/languageStore";
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
  const { t } = useTranslation("app");
  const language = useLanguageStore((s) => s.language);
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
        t("settings.driveConnected"),
        t("settings.storageBody")
      );
    } catch (error) {
      showAlert(
        t("settings.driveTitle"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
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
      showAlert(t("settings.driveLocalOnly"), t("settings.storageStatusLocal"));
    } catch (error) {
      showAlert(
        t("settings.storageDisconnectDrive"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
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
        t("settings.exportDoneTitle"),
        t("settings.restoreDoneBody", { count: result.filCount })
      );
    } catch (error) {
      showAlert(
        t("settings.backupTitle"),
        error instanceof Error ? error.message : t("settings.exportFailBody")
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
        t("settings.restoreDoneTitle"),
        t("settings.restoreDoneBody", { count: result.filCount })
      );
    } catch (error) {
      showAlert(
        t("settings.restoreFailTitle"),
        error instanceof Error ? error.message : t("settings.restoreFailBody")
      );
    } finally {
      setBusy(null);
    }
  }

  const statusLabel = connected
    ? meta?.lastSyncAt
      ? t("settings.storageStatusSynced", {
          date: formatSessionDate(meta.lastSyncAt, language),
        })
      : t("settings.storageStatusConnected")
    : t("settings.storageStatusLocal");

  return (
    <View className={`rounded-3xl border px-5 py-5 gap-4 ${panelBg(isDark)} ${className}`}>
      <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
        {t("settings.storageLabel")}
      </Text>
      <Text className={`font-medium ${textPrimary(isDark)}`}>
        {t("settings.storageTitle")}
      </Text>
      <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
        {t("settings.storageBody")}
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
          {t("settings.storageConfigHint")}
        </Text>
      ) : null}

      {busy ? <ActivityIndicator color="#496349" /> : null}

      {!connected ? (
        <PrimaryButton
          label={
            busy === "connect"
              ? t("settings.storageConnecting")
              : t("settings.driveConnect")
          }
          onPress={() => void handleConnect()}
          disabled={!configured || busy !== null}
        />
      ) : (
        <View className="gap-3">
          <PrimaryButton
            label={
              busy === "backup"
                ? t("settings.storageBackingUp")
                : t("settings.driveBackup")
            }
            onPress={() => void handleBackup()}
            disabled={busy !== null}
          />
          <PrimaryButton
            label={
              busy === "restore"
                ? t("settings.storageRestoring")
                : t("settings.driveRestore")
            }
            onPress={() => void handleRestore()}
            disabled={busy !== null}
            variant="secondary"
          />
          <PrimaryButton
            label={
              busy === "disconnect"
                ? t("settings.storageDisconnecting")
                : t("settings.storageDisconnectDrive")
            }
            onPress={() => void handleDisconnect()}
            disabled={busy !== null}
            variant="ghost"
          />
        </View>
      )}
    </View>
  );
}
