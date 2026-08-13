import { useCallback, useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ARTISTIC_TECHNIQUES,
  isAiAnalysisSupported,
  type ArtisticTechnique,
} from "@art-therapie/shared";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { showAlert } from "@/lib/alert";
import {
  addCustomTechnique,
  deleteCustomTechnique,
  getManagedTechniquesState,
  setBuiltinTechniqueEnabled,
  setCustomTechniqueEnabled,
  type CustomTechnique,
  type ManagedTechniquesState,
} from "@/lib/techniques/managed";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import {
  panelBg,
  textMuted,
  textPrimary,
  textSecondary,
} from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function TechniquesSettingsScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("app");
  const [state, setState] = useState<ManagedTechniquesState | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [mapsTo, setMapsTo] = useState<ArtisticTechnique>("mixed_media");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    void getManagedTechniquesState().then(setState);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function toggleBuiltin(id: ArtisticTechnique, enabled: boolean) {
    setBusy(true);
    try {
      setState(await setBuiltinTechniqueEnabled(id, enabled));
    } finally {
      setBusy(false);
    }
  }

  async function toggleCustom(tech: CustomTechnique, enabled: boolean) {
    setBusy(true);
    try {
      setState(await setCustomTechniqueEnabled(tech.id, enabled));
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    if (newLabel.trim().length < 2) {
      showAlert(
        t("techniquesPage.alertTitle"),
        t("techniquesPage.nameTooShort")
      );
      return;
    }
    setBusy(true);
    try {
      setState(
        await addCustomTechnique({
          label: newLabel,
          mapsTo,
          aiAnalysis: isAiAnalysisSupported(mapsTo),
        })
      );
      setNewLabel("");
    } catch (error) {
      showAlert(
        t("techniquesPage.alertTitle"),
        error instanceof Error ? error.message : t("techniquesPage.addFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(tech: CustomTechnique) {
    setBusy(true);
    try {
      setState(await deleteCustomTechnique(tech.id));
    } catch (error) {
      showAlert(
        t("techniquesPage.alertTitle"),
        error instanceof Error ? error.message : t("techniquesPage.deleteFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <ScreenContainer compactTop>
        <ScreenNavBar backLabel={t("nav.backSettings")} />
        <Text className={textSecondary(isDark)}>
          {t("techniquesPage.loading")}
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable refreshable compactTop>
      <ScreenNavBar backLabel={t("nav.backSettings")} />
      <PastekScreenHero
        label={t("techniquesPage.heroLabel")}
        title={t("techniquesPage.heroTitle")}
        accent={t("techniquesPage.heroAccent")}
        description={t("techniquesPage.heroDescription")}
        className="mb-6"
      />

      <Text className={`text-sm font-medium mb-3 ${textPrimary(isDark)}`}>
        {t("techniquesPage.builtinTitle")}
      </Text>
      <View className="gap-2 mb-8">
        {ARTISTIC_TECHNIQUES.map((id) => {
          const enabled = !state.disabledBuiltin.includes(id);
          return (
            <View
              key={id}
              className={`rounded-2xl border px-4 py-3 flex-row items-center justify-between ${panelBg(isDark)}`}
            >
              <View className="flex-1 pr-3">
                <Text className={`font-medium ${textPrimary(isDark)}`}>
                  {localizedTechniqueLabel(id)}
                </Text>
                <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`}>
                  {isAiAnalysisSupported(id)
                    ? t("techniquesPage.aiAnalysisYes")
                    : t("techniquesPage.aiAnalysisNo")}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => void toggleBuiltin(id, v)}
                disabled={busy}
              />
            </View>
          );
        })}
      </View>

      <Text className={`text-sm font-medium mb-3 ${textPrimary(isDark)}`}>
        {t("techniquesPage.customTitle")}
      </Text>
      {state.custom.length === 0 ? (
        <Text className={`text-sm mb-4 ${textSecondary(isDark)}`}>
          {t("techniquesPage.customEmpty")}
        </Text>
      ) : (
        <View className="gap-2 mb-4">
          {state.custom.map((tech) => (
            <View
              key={tech.id}
              className={`rounded-2xl border px-4 py-3 ${panelBg(isDark)}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1 pr-3">
                  <Text className={`font-medium ${textPrimary(isDark)}`}>
                    {tech.label}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${textMuted(isDark)}`}>
                    {t("techniquesPage.basedOn", {
                      technique: localizedTechniqueLabel(tech.mapsTo),
                    })}
                  </Text>
                </View>
                <Switch
                  value={tech.enabled}
                  onValueChange={(v) => void toggleCustom(tech, v)}
                  disabled={busy}
                />
              </View>
              <Pressable onPress={() => void handleDelete(tech)} disabled={busy}>
                <Text className="text-red-500 text-xs font-medium">
                  {t("techniquesPage.delete")}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className={`rounded-2xl border px-4 py-4 gap-3 mb-8 ${panelBg(isDark)}`}>
        <Text className={`font-medium ${textPrimary(isDark)}`}>
          {t("techniquesPage.addTitle")}
        </Text>
        <TextInput
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder={t("techniquesPage.addPlaceholder")}
          placeholderTextColor={isDark ? "#8A8478" : "#B8A090"}
          className={`border rounded-xl px-3 py-2 ${
            isDark
              ? "border-sand-600 bg-sand-800 text-sand-100"
              : "border-sand-200 bg-white text-sand-800"
          }`}
        />
        <Text className={`text-xs ${textMuted(isDark)}`}>
          {t("techniquesPage.baseTechnique", {
            technique: localizedTechniqueLabel(mapsTo),
          })}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(["painting", "drawing", "writing", "mixed_media", "music", "video"] as ArtisticTechnique[]).map(
            (id) => (
              <Pressable
                key={id}
                onPress={() => setMapsTo(id)}
                className={`rounded-full px-3 py-1.5 border ${
                  mapsTo === id
                    ? "bg-sage-500 border-sage-500"
                    : isDark
                      ? "border-sand-600"
                      : "border-sand-200"
                }`}
              >
                <Text
                  className={`text-xs ${
                    mapsTo === id ? "text-white" : textPrimary(isDark)
                  }`}
                >
                  {localizedTechniqueLabel(id)}
                </Text>
              </Pressable>
            )
          )}
        </View>
        <PrimaryButton
          label={busy ? t("techniquesPage.adding") : t("techniquesPage.add")}
          onPress={() => void handleAdd()}
          disabled={busy}
        />
      </View>
    </ScreenContainer>
  );
}
