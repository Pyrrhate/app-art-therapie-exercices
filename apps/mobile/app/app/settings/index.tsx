import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/lib/routes";
import { SupportButton } from "@/components/SupportButton";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { ThemePicker } from "@/components/ThemePicker";
import { TimerSoundPicker } from "@/components/TimerSoundPicker";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { checkHealth } from "@/lib/api";
import { summarizeBackup, parseAppBackupJson } from "@/lib/backup/build";
import {
  exportAppBackup,
  formatRestoreConfirmMessage,
} from "@/lib/backup/export";
import { pickBackupFileContents } from "@/lib/backup/pick";
import { assertBackupSize, restoreAppBackup } from "@/lib/backup/restore";
import { clearAllLocalData } from "@/lib/data/clearAll";
import { showAlert } from "@/lib/alert";
import { getApiUrl } from "@/lib/config";
import { getTimerSound, setTimerSound, type ThemePreference } from "@/lib/preferences";
import { previewTimerSound, type TimerSoundId } from "@/lib/sounds";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useThemeStore } from "@/lib/themeStore";

export default function SettingsScreen() {
  const { t } = useTranslation("app");
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = theme === "dark";
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [textModel, setTextModel] = useState<string | null>(null);
  const [visionModel, setVisionModel] = useState<string | null>(null);
  const [reflectionPipeline, setReflectionPipeline] = useState<string | null>(
    null
  );
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [timerSound, setTimerSoundState] = useState<TimerSoundId>("gong");
  const [backupBusy, setBackupBusy] = useState(false);
  const apiUrl = getApiUrl();

  useEffect(() => {
    checkHealth().then(
      ({
        ok,
        provider: p,
        aiConfigured: ai,
        textModel: tm,
        visionModel: vm,
        reflectionPipeline: rp,
        aiHint: hint,
      }) => {
        setApiOk(ok);
        setProvider(p ?? null);
        setAiConfigured(ai ?? null);
        setTextModel(tm ?? null);
        setVisionModel(vm ?? null);
        setReflectionPipeline(rp ?? null);
        setAiHint(hint ?? null);
      }
    );
    getTimerSound().then(setTimerSoundState);
  }, []);

  async function handleTimerSoundChange(id: TimerSoundId) {
    setTimerSoundState(id);
    await setTimerSound(id);
    await previewTimerSound(id);
  }

  async function handleThemeChange(next: ThemePreference) {
    await setTheme(next);
  }

  async function handleClearAllData() {
    if (backupBusy) return;
    const confirmed =
      Platform.OS === "web"
        ? window.confirm(t("settings.eraseConfirmWeb"))
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              t("settings.eraseConfirmTitle"),
              t("settings.eraseConfirmBody"),
              [
                {
                  text: t("settings.cancel"),
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: t("settings.eraseConfirmAction"),
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ]
            );
          });
    if (!confirmed) return;
    setBackupBusy(true);
    try {
      await clearAllLocalData();
      showAlert(t("settings.eraseDoneTitle"), t("settings.eraseDoneBody"));
    } catch (err) {
      showAlert(
        t("settings.eraseFailTitle"),
        err instanceof Error ? err.message : t("settings.eraseFailBody")
      );
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleExportBackup() {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const result = await exportAppBackup();
      showAlert(t("settings.exportDoneTitle"), result.message);
    } catch (error) {
      showAlert(
        t("settings.exportFailTitle"),
        error instanceof Error ? error.message : t("settings.exportFailBody")
      );
    } finally {
      setBackupBusy(false);
    }
  }

  function confirmRestore(summary: ReturnType<typeof summarizeBackup>): Promise<boolean> {
    const message = formatRestoreConfirmMessage(summary);
    if (Platform.OS === "web") {
      return Promise.resolve(
        window.confirm(`${t("settings.restoreConfirmTitle")}\n\n${message}`)
      );
    }
    return new Promise((resolve) => {
      Alert.alert(t("settings.restoreConfirmTitle"), message, [
        {
          text: t("settings.cancel"),
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: t("settings.restoreConfirmAction"),
          style: "destructive",
          onPress: () => resolve(true),
        },
      ]);
    });
  }

  async function handleRestoreBackup() {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const json = await pickBackupFileContents();
      if (!json) return;

      assertBackupSize(json);
      const summary = summarizeBackup(json);
      const confirmed = await confirmRestore(summary);
      if (!confirmed) return;

      const backup = parseAppBackupJson(json);
      await restoreAppBackup(backup);
      await getTimerSound().then(setTimerSoundState);
      showAlert(
        t("settings.restoreDoneTitle"),
        t("settings.restoreDoneBody", { count: summary.filCount })
      );
    } catch (error) {
      showAlert(
        t("settings.restoreFailTitle"),
        error instanceof Error ? error.message : t("settings.restoreFailBody")
      );
    } finally {
      setBackupBusy(false);
    }
  }

  async function refreshHealth() {
    const {
      ok,
      provider: p,
      aiConfigured: ai,
      textModel: tm,
      visionModel: vm,
      reflectionPipeline: rp,
      aiHint: hint,
    } = await checkHealth();
    setApiOk(ok);
    setProvider(p ?? null);
    setAiConfigured(ai ?? null);
    setTextModel(tm ?? null);
    setVisionModel(vm ?? null);
    setReflectionPipeline(rp ?? null);
    setAiHint(hint ?? null);
  }

  return (
    <ScreenContainer scrollable refreshable onRefresh={refreshHealth} compactTop>
      <ScreenNavBar />

      <PastekScreenHero
        label={t("settings.heroLabel")}
        title={t("settings.heroTitle")}
        accent={t("settings.heroAccent")}
        description={t("settings.heroDescription")}
        className="mb-8"
      />

      <View className="gap-4 pb-8">
        <AccountPanel />

        <View className={`rounded-2xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
            {t("settings.languageTitle")}
          </Text>
          <Text className={`text-sm leading-5 mb-4 ${textSecondary(isDark)}`}>
            {t("settings.languageHint")}
          </Text>
          <LanguageToggle variant="settings" />
        </View>

        <Pressable
          onPress={() => router.push(ROUTES.premiumCloud)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View className="flex-1 pr-3">
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.driveTitle")}
            </Text>
            <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
              {t("settings.driveHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.aiEngines)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View className="flex-1 pr-3">
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.aiEnginesTitle")}
            </Text>
            <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
              {t("settings.aiEnginesHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.prompts)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View className="flex-1 pr-3">
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.promptsTitle")}
            </Text>
            <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
              {t("settings.promptsHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.techniques)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View className="flex-1 pr-3">
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.techniquesTitle")}
            </Text>
            <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
              {t("settings.techniquesHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.deepQuestions)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View className="flex-1 pr-3">
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.deepQuestionsTitle")}
            </Text>
            <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
              {t("settings.deepQuestionsHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            {t("settings.appearanceTitle")}
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            {t("settings.appearanceHint")}
          </Text>
          <ThemePicker selected={theme} onSelect={handleThemeChange} />
        </View>

        <Pressable
          onPress={() => router.push(ROUTES.fil)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View>
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.filTitle")}
            </Text>
            <Text className={`text-sm ${textSecondary(isDark)}`}>
              {t("settings.filHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.changelog)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center mb-3 ${panelBg(isDark)}`}
        >
          <View>
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.updatesTitle")}
            </Text>
            <Text className={`text-sm ${textSecondary(isDark)}`}>
              {t("settings.updatesHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.privacy)}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View>
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              {t("settings.privacyTitle")}
            </Text>
            <Text className={`text-sm ${textSecondary(isDark)}`}>
              {t("settings.privacyHint")}
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            {t("settings.timerTitle")}
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            {t("settings.timerHint")}
          </Text>
          <TimerSoundPicker
            selected={timerSound}
            onSelect={handleTimerSoundChange}
          />
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            {t("settings.apiTitle")}
          </Text>
          <Text className={`text-xs mb-3 ${textMuted(isDark)}`} numberOfLines={2}>
            {apiUrl ||
              "(proxy local → " +
                (process.env.EXPO_PUBLIC_API_URL ?? "API") +
                ")"}
          </Text>
          <View className="flex-row items-center gap-2">
            {apiOk === null ? (
              <ActivityIndicator size="small" color="#6B8F71" />
            ) : (
              <>
                <View
                  className={`w-2 h-2 rounded-full ${apiOk ? "bg-sage-500" : "bg-red-400"}`}
                />
                <Text className={`text-sm ${textSecondary(isDark)}`}>
                  {apiOk
                    ? t("settings.apiConnected", {
                        provider: provider ? ` (${provider})` : "",
                      })
                    : t("settings.apiDown")}
                </Text>
              </>
            )}
          </View>
          {aiHint && (
            <Text className="text-amber-700 text-xs mt-3 leading-5">
              {aiHint}
            </Text>
          )}
          {apiOk && aiConfigured === false && (
            <Text className="text-amber-700 text-xs mt-3 leading-5">
              {t("settings.apiAiMissing")}
            </Text>
          )}
          {apiOk && aiConfigured && (
            <Text className={`text-xs mt-2 leading-5 ${textMuted(isDark)}`}>
              {t("settings.apiText", { model: textModel ?? "—" })}
              {"\n"}
              {t("settings.apiVision", { model: visionModel ?? "—" })}
              {reflectionPipeline
                ? `\n${t("settings.apiReflection", { pipeline: reflectionPipeline })}`
                : ""}
              {"\n"}
              {t("settings.apiRecommended")}
            </Text>
          )}
          {!apiOk && apiOk !== null && (
            <Text className={`text-xs mt-3 leading-5 ${textMuted(isDark)}`}>
              {t("settings.apiTroubleshoot")}
            </Text>
          )}
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            {t("settings.backupTitle")}
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            {t("settings.backupHint")}
          </Text>
          <View className="gap-3">
            <PrimaryButton
              label={backupBusy ? "…" : t("settings.backupExport")}
              onPress={() => void handleExportBackup()}
              disabled={backupBusy}
              align="stretch"
            />
            <PrimaryButton
              label={t("settings.backupRestore")}
              onPress={() => void handleRestoreBackup()}
              variant="ghost"
              disabled={backupBusy}
              align="stretch"
            />
          </View>
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            {t("settings.localTitle")}
          </Text>
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            {t("settings.localHint")}
          </Text>
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            {t("settings.eraseTitle")}
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            {t("settings.eraseHint")}
          </Text>
          <PrimaryButton
            label={t("settings.eraseButton")}
            onPress={() => void handleClearAllData()}
            variant="ghost"
            disabled={backupBusy}
            align="stretch"
          />
        </View>

        <SupportButton />

        <Text className={`text-xs text-center mt-4 ${textMuted(isDark)}`}>
          {t("settings.version")}
        </Text>
      </View>
    </ScreenContainer>
  );
}
