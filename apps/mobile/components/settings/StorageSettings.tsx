import { useCallback, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
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
import {
  backupLocalDataToKDrive,
  connectKDrive,
  disconnectKDrive,
  getKDriveConnectionStatus,
  restoreLocalDataFromKDrive,
} from "@/lib/storage/kDriveAdapter";
import type { KDriveMeta } from "@/lib/storage/kDriveTokens";
import {
  backupLocalDataToOneDrive,
  connectOneDrive,
  disconnectOneDrive,
  getOneDriveConnectionStatus,
  restoreLocalDataFromOneDrive,
} from "@/lib/storage/oneDriveAdapter";
import type { OneDriveMeta } from "@/lib/storage/oneDriveTokens";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

type BusyKind =
  | "g-connect"
  | "g-disconnect"
  | "g-backup"
  | "g-restore"
  | "k-connect"
  | "k-disconnect"
  | "k-backup"
  | "k-restore"
  | "o-connect"
  | "o-disconnect"
  | "o-backup"
  | "o-restore"
  | null;

/**
 * Sauvegarde locale ↔ Google Drive + Infomaniak kDrive + OneDrive (local-first).
 */
export function StorageSettings({ className = "" }: { className?: string }) {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const language = useLanguageStore((s) => s.language);

  const [gConnected, setGConnected] = useState(false);
  const [gConfigured, setGConfigured] = useState(isGoogleDriveClientConfigured());
  const [gMeta, setGMeta] = useState<GoogleDriveMeta | null>(null);

  const [kConnected, setKConnected] = useState(false);
  const [kMeta, setKMeta] = useState<KDriveMeta | null>(null);
  const [kDriveId, setKDriveId] = useState("");
  const [kToken, setKToken] = useState("");

  const [oConnected, setOConnected] = useState(false);
  const [oMeta, setOMeta] = useState<OneDriveMeta | null>(null);
  const [oToken, setOToken] = useState("");

  const [busy, setBusy] = useState<BusyKind>(null);

  const refresh = useCallback(async () => {
    const [gStatus, kStatus, oStatus] = await Promise.all([
      getGoogleDriveConnectionStatus(),
      getKDriveConnectionStatus(),
      getOneDriveConnectionStatus(),
    ]);
    setGConfigured(gStatus.configured);
    setGConnected(gStatus.connected);
    setGMeta(gStatus.meta);
    setKConnected(kStatus.connected);
    setKMeta(kStatus.meta);
    setOConnected(oStatus.connected);
    setOMeta(oStatus.meta);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  function providerStatus(
    connected: boolean,
    meta: { lastSyncAt: string | null } | null,
    connectedKey: string,
    syncedKey: string
  ): string {
    if (!connected) return t("settings.storageStatusLocal");
    if (meta?.lastSyncAt) {
      return t(syncedKey, {
        date: formatSessionDate(meta.lastSyncAt, language),
      });
    }
    return t(connectedKey);
  }

  async function handleGoogleConnect() {
    setBusy("g-connect");
    try {
      await connectGoogleDrive();
      await refresh();
      showAlert(t("settings.driveConnected"), t("settings.storageBody"));
    } catch (error) {
      showAlert(
        t("settings.driveTitle"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogleDisconnect() {
    setBusy("g-disconnect");
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

  async function handleGoogleBackup() {
    setBusy("g-backup");
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

  async function handleGoogleRestore() {
    setBusy("g-restore");
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

  async function handleKDriveConnect() {
    setBusy("k-connect");
    try {
      await connectKDrive({ apiToken: kToken, driveId: kDriveId });
      setKToken("");
      await refresh();
      showAlert(t("settings.kdriveConnected"), t("settings.kdriveBody"));
    } catch (error) {
      showAlert(
        t("settings.kdriveTitle"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleKDriveDisconnect() {
    setBusy("k-disconnect");
    try {
      await disconnectKDrive();
      await refresh();
      showAlert(t("settings.driveLocalOnly"), t("settings.storageStatusLocal"));
    } catch (error) {
      showAlert(
        t("settings.kdriveDisconnect"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleKDriveBackup() {
    setBusy("k-backup");
    try {
      const result = await backupLocalDataToKDrive();
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

  async function handleKDriveRestore() {
    setBusy("k-restore");
    try {
      const result = await restoreLocalDataFromKDrive();
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

  async function handleOneDriveConnect() {
    setBusy("o-connect");
    try {
      await connectOneDrive({ accessToken: oToken });
      setOToken("");
      await refresh();
      showAlert(t("settings.onedriveConnected"), t("settings.onedriveBody"));
    } catch (error) {
      showAlert(
        t("settings.onedriveTitle"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleOneDriveDisconnect() {
    setBusy("o-disconnect");
    try {
      await disconnectOneDrive();
      await refresh();
      showAlert(t("settings.driveLocalOnly"), t("settings.storageStatusLocal"));
    } catch (error) {
      showAlert(
        t("settings.onedriveDisconnect"),
        error instanceof Error ? error.message : t("settings.eraseFailBody")
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleOneDriveBackup() {
    setBusy("o-backup");
    try {
      const result = await backupLocalDataToOneDrive();
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

  async function handleOneDriveRestore() {
    setBusy("o-restore");
    try {
      const result = await restoreLocalDataFromOneDrive();
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

  const inputClass = `rounded-2xl border border-sand-200 px-4 py-3 text-base ${
    isDark ? "bg-sand-900 text-sand-100" : "bg-white text-sand-800"
  }`;

  return (
    <View className={`gap-5 ${className}`}>
      <View className={`rounded-3xl border px-5 py-5 gap-4 ${panelBg(isDark)}`}>
        <Text className="text-xs uppercase tracking-widest text-sage-500 font-medium">
          {t("settings.storageLabel")}
        </Text>
        <Text className={`font-medium ${textPrimary(isDark)}`}>
          {t("settings.storageTitle")}
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("settings.storageBody")}
        </Text>
      </View>

      {/* Google Drive */}
      <View className={`rounded-3xl border px-5 py-5 gap-4 ${panelBg(isDark)}`}>
        <Text className={`font-medium ${textPrimary(isDark)}`}>
          {t("settings.driveSectionTitle")}
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("settings.driveCardBody")}
        </Text>

        <View
          className={`rounded-2xl px-4 py-3 ${
            isDark ? "bg-sand-900/60" : "bg-sage-50"
          }`}
        >
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            {providerStatus(
              gConnected,
              gMeta,
              "settings.storageStatusConnected",
              "settings.storageStatusSynced"
            )}
          </Text>
          {gConnected && gMeta?.accountHint ? (
            <Text className={`text-xs mt-1 ${textMuted(isDark)}`}>
              {gMeta.accountHint}
            </Text>
          ) : null}
        </View>

        {!gConfigured ? (
          <Text className="text-amber-700 text-xs leading-5">
            {t("settings.storageConfigHint")}
          </Text>
        ) : null}

        {busy?.startsWith("g-") ? <ActivityIndicator color="#496349" /> : null}

        {!gConnected ? (
          <View className="items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "g-connect"
                    ? t("settings.storageConnecting")
                    : t("settings.driveConnect")
                }
                onPress={() => void handleGoogleConnect()}
                disabled={!gConfigured || busy !== null}
              />
            </View>
          </View>
        ) : (
          <View className="gap-3 items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "g-backup"
                    ? t("settings.storageBackingUp")
                    : t("settings.driveBackup")
                }
                onPress={() => void handleGoogleBackup()}
                disabled={busy !== null}
              />
            </View>
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "g-restore"
                    ? t("settings.storageRestoring")
                    : t("settings.driveRestore")
                }
                onPress={() => void handleGoogleRestore()}
                disabled={busy !== null}
                variant="secondary"
              />
            </View>
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "g-disconnect"
                    ? t("settings.storageDisconnecting")
                    : t("settings.storageDisconnectDrive")
                }
                onPress={() => void handleGoogleDisconnect()}
                disabled={busy !== null}
                variant="ghost"
              />
            </View>
          </View>
        )}
      </View>

      {/* Infomaniak kDrive */}
      <View className={`rounded-3xl border px-5 py-5 gap-4 ${panelBg(isDark)}`}>
        <Text className={`font-medium ${textPrimary(isDark)}`}>
          {t("settings.kdriveSectionTitle")}
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("settings.kdriveBody")}
        </Text>

        <View
          className={`rounded-2xl px-4 py-3 ${
            isDark ? "bg-sand-900/60" : "bg-sage-50"
          }`}
        >
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            {providerStatus(
              kConnected,
              kMeta,
              "settings.kdriveStatusConnected",
              "settings.kdriveStatusSynced"
            )}
          </Text>
          {kConnected && kMeta?.accountHint ? (
            <Text className={`text-xs mt-1 ${textMuted(isDark)}`}>
              {kMeta.accountHint}
            </Text>
          ) : null}
        </View>

        {busy?.startsWith("k-") ? <ActivityIndicator color="#496349" /> : null}

        {!kConnected ? (
          <View className="gap-3">
            <View>
              <Text className={`text-sm font-medium mb-2 ${textSecondary(isDark)}`}>
                {t("settings.kdriveIdLabel")}
              </Text>
              <TextInput
                className={inputClass}
                value={kDriveId}
                onChangeText={setKDriveId}
                placeholder={t("settings.kdriveIdPlaceholder")}
                placeholderTextColor="#A89F91"
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={busy === null}
              />
            </View>
            <View>
              <Text className={`text-sm font-medium mb-2 ${textSecondary(isDark)}`}>
                {t("settings.kdriveTokenLabel")}
              </Text>
              <TextInput
                className={inputClass}
                value={kToken}
                onChangeText={setKToken}
                placeholder={t("settings.kdriveTokenPlaceholder")}
                placeholderTextColor="#A89F91"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={busy === null}
              />
            </View>
            <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
              {t("settings.kdriveHelp")}
            </Text>
            <View className="items-center">
              <View className="w-1/2">
                <PrimaryButton
                  label={
                    busy === "k-connect"
                      ? t("settings.storageConnecting")
                      : t("settings.kdriveConnect")
                  }
                  onPress={() => void handleKDriveConnect()}
                  disabled={
                    busy !== null || !kDriveId.trim() || kToken.trim().length < 20
                  }
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-3 items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "k-backup"
                    ? t("settings.storageBackingUp")
                    : t("settings.kdriveBackup")
                }
                onPress={() => void handleKDriveBackup()}
                disabled={busy !== null}
              />
            </View>
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "k-restore"
                    ? t("settings.storageRestoring")
                    : t("settings.kdriveRestore")
                }
                onPress={() => void handleKDriveRestore()}
                disabled={busy !== null}
                variant="secondary"
              />
            </View>
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "k-disconnect"
                    ? t("settings.storageDisconnecting")
                    : t("settings.kdriveDisconnect")
                }
                onPress={() => void handleKDriveDisconnect()}
                disabled={busy !== null}
                variant="ghost"
              />
            </View>
          </View>
        )}
      </View>

      {/* OneDrive */}
      <View className={`rounded-3xl border px-5 py-5 gap-4 ${panelBg(isDark)}`}>
        <Text className={`font-medium ${textPrimary(isDark)}`}>
          {t("settings.onedriveSectionTitle")}
        </Text>
        <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
          {t("settings.onedriveBody")}
        </Text>

        <View
          className={`rounded-2xl px-4 py-3 ${
            isDark ? "bg-sand-900/60" : "bg-sage-50"
          }`}
        >
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            {providerStatus(
              oConnected,
              oMeta,
              "settings.onedriveStatusConnected",
              "settings.onedriveStatusSynced"
            )}
          </Text>
          {oConnected && oMeta?.accountHint ? (
            <Text className={`text-xs mt-1 ${textMuted(isDark)}`}>
              {oMeta.accountHint}
            </Text>
          ) : null}
        </View>

        {busy?.startsWith("o-") ? <ActivityIndicator color="#496349" /> : null}

        {!oConnected ? (
          <View className="gap-3">
            <View>
              <Text className={`text-sm font-medium mb-2 ${textSecondary(isDark)}`}>
                {t("settings.onedriveTokenLabel")}
              </Text>
              <TextInput
                className={inputClass}
                value={oToken}
                onChangeText={setOToken}
                placeholder={t("settings.onedriveTokenPlaceholder")}
                placeholderTextColor="#A89F91"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={busy === null}
              />
            </View>
            <Text className={`text-xs leading-5 ${textMuted(isDark)}`}>
              {t("settings.onedriveHelp")}
            </Text>
            <View className="items-center">
              <View className="w-1/2">
                <PrimaryButton
                  label={
                    busy === "o-connect"
                      ? t("settings.storageConnecting")
                      : t("settings.onedriveConnect")
                  }
                  onPress={() => void handleOneDriveConnect()}
                  disabled={busy !== null || oToken.trim().length < 40}
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-3 items-center">
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "o-backup"
                    ? t("settings.storageBackingUp")
                    : t("settings.onedriveBackup")
                }
                onPress={() => void handleOneDriveBackup()}
                disabled={busy !== null}
              />
            </View>
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "o-restore"
                    ? t("settings.storageRestoring")
                    : t("settings.onedriveRestore")
                }
                onPress={() => void handleOneDriveRestore()}
                disabled={busy !== null}
                variant="secondary"
              />
            </View>
            <View className="w-1/2">
              <PrimaryButton
                label={
                  busy === "o-disconnect"
                    ? t("settings.storageDisconnecting")
                    : t("settings.onedriveDisconnect")
                }
                onPress={() => void handleOneDriveDisconnect()}
                disabled={busy !== null}
                variant="ghost"
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
