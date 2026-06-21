import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SupportButton } from "@/components/SupportButton";
import { ThemePicker } from "@/components/ThemePicker";
import { TimerSoundPicker } from "@/components/TimerSoundPicker";
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
import { showAlert } from "@/lib/alert";
import { getApiUrl } from "@/lib/config";
import { getTimerSound, setTimerSound, type ThemePreference } from "@/lib/preferences";
import { previewTimerSound, type TimerSoundId } from "@/lib/sounds";
import { panelBg, textMuted, textPrimary, textSecondary } from "@/lib/themeClasses";
import { useThemeStore } from "@/lib/themeStore";

export default function SettingsScreen() {
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

  async function handleExportBackup() {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const result = await exportAppBackup();
      showAlert("Sauvegarde exportée", result.message);
    } catch (error) {
      showAlert(
        "Export impossible",
        error instanceof Error ? error.message : "Réessayez dans un instant."
      );
    } finally {
      setBackupBusy(false);
    }
  }

  function confirmRestore(summary: ReturnType<typeof summarizeBackup>): Promise<boolean> {
    const message = formatRestoreConfirmMessage(summary);
    if (Platform.OS === "web") {
      return Promise.resolve(window.confirm(`Restaurer cette sauvegarde ?\n\n${message}`));
    }
    return new Promise((resolve) => {
      Alert.alert("Restaurer cette sauvegarde ?", message, [
        { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Remplacer",
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
        "Restauration terminée",
        `${summary.filCount} trace${summary.filCount > 1 ? "s" : ""} récupérée${summary.filCount > 1 ? "s" : ""} dans le Fil créatif.`
      );
    } catch (error) {
      showAlert(
        "Restauration impossible",
        error instanceof Error ? error.message : "Fichier invalide ou corrompu."
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
    <ScreenContainer scrollable refreshable onRefresh={refreshHealth}>
      <ScreenNavBar />

      <PastekScreenHero
        label="Paramètres"
        title="Vos "
        accent="préférences"
        description="Vos créations restent sur votre appareil. Aucun compte requis."
        className="mb-8"
      />

      <View className="gap-4 pb-8">
        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            Apparence
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            Choisissez un thème clair ou sombre pour toute l&apos;application.
          </Text>
          <ThemePicker selected={theme} onSelect={handleThemeChange} />
        </View>

        <Pressable
          onPress={() => router.push("/fil")}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View>
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              Fil créatif
            </Text>
            <Text className={`text-sm ${textSecondary(isDark)}`}>
              Toutes vos traces — rituels et amorces
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/privacy")}
          className={`rounded-2xl border px-5 py-5 flex-row justify-between items-center ${panelBg(isDark)}`}
        >
          <View>
            <Text className={`font-medium mb-1 ${textPrimary(isDark)}`}>
              Confidentialité & mentions légales
            </Text>
            <Text className={`text-sm ${textSecondary(isDark)}`}>
              Données locales, envoi IA, vos droits
            </Text>
          </View>
          <Text className="text-sage-500 text-lg">→</Text>
        </Pressable>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            Son de fin de timer
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            Un signal doux lorsque le temps créatif est écoulé.
          </Text>
          <TimerSoundPicker
            selected={timerSound}
            onSelect={handleTimerSoundChange}
          />
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>Connexion API</Text>
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
                    ? `Connecté${provider ? ` (${provider})` : ""}`
                    : "Serveur inaccessible — vérifiez l'URL ou le réseau"}
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
              IA non configurée (HF_TOKEN manquant sur Vercel). Exercices et
              réflexion photo utilisent le mode secours.
            </Text>
          )}
          {apiOk && aiConfigured && (
            <Text className={`text-xs mt-2 leading-5 ${textMuted(isDark)}`}>
              Texte : {textModel ?? "—"}
              {"\n"}Vision : {visionModel ?? "—"}
              {reflectionPipeline
                ? `\nRéflexion : ${reflectionPipeline}`
                : ""}
              {"\n"}
              Recommandé : zai-org/GLM-4.5V:novita pour l'analyse photo.
            </Text>
          )}
          {!apiOk && apiOk !== null && (
            <Text className={`text-xs mt-3 leading-5 ${textMuted(isDark)}`}>
              Web local : relancez avec npm run mobile:web:clear après npm
              install. Sur téléphone : utilisez l'IP locale du PC dans
              EXPO_PUBLIC_API_URL. Vérifiez aussi ALLOWED_ORIGINS sur Vercel.
            </Text>
          )}
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>
            Sauvegarde & restauration
          </Text>
          <Text className={`text-sm mb-4 leading-5 ${textSecondary(isDark)}`}>
            Exportez votre Fil créatif, vos préférences et votre brouillon de
            rituel dans un fichier JSON — uniquement chez vous. Restaurez-le sur
            un autre appareil sans compte ni serveur Art Thérapie.
          </Text>
          <View className="gap-3">
            <PrimaryButton
              label={backupBusy ? "…" : "Exporter ma pratique"}
              onPress={() => void handleExportBackup()}
              disabled={backupBusy}
              align="stretch"
            />
            <PrimaryButton
              label="Restaurer depuis un fichier"
              onPress={() => void handleRestoreBackup()}
              variant="ghost"
              disabled={backupBusy}
              align="stretch"
            />
          </View>
        </View>

        <View className={`rounded-3xl border px-5 py-5 ${panelBg(isDark)}`}>
          <Text className={`font-medium mb-2 ${textPrimary(isDark)}`}>Stockage local</Text>
          <Text className={`text-sm leading-5 ${textSecondary(isDark)}`}>
            Toutes vos traces sont enregistrées automatiquement dans le Fil
            créatif sur cet appareil. Pour changer de téléphone ou tablette,
            exportez puis restaurez une sauvegarde.
          </Text>
        </View>

        <SupportButton />

        <Text className={`text-xs text-center mt-4 ${textMuted(isDark)}`}>
          Art Thérapie · v0.1.0 · MVP
        </Text>
      </View>
    </ScreenContainer>
  );
}
