import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { navigateHome } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { ExperienceModeSelector } from "@/components/experience/ExperienceModeSelector";
import { DurationPicker } from "@/components/DurationPicker";
import { AccentCard, ContentCard } from "@/components/ui/Card";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { RitualProgressBar } from "@/components/ui/RitualProgressBar";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { TechniquePicker } from "@/components/TechniquePicker";
import { isAiAnalysisSupported } from "@/constants";
import { resolveByokCredentials } from "@/lib/aiKeys";
import { ApiError, generateExercise } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { localExerciseBannerMessage } from "@/lib/localExerciseBanner";
import { applyActiveSeasonToRitual } from "@/lib/seasons/apply";
import type { SeasonRun } from "@/lib/seasons/types";
import { useRitualStore } from "@/lib/store";
import { useEnabledTechniques } from "@/lib/techniques/managed";

export default function RitualScreen() {
  const { t } = useTranslation("ritual");
  const {
    impulse,
    technique,
    techniqueLabel,
    durationMinutes,
    experienceMode,
    exerciseFallbackNote,
    setImpulse,
    setTechnique,
    setDurationMinutes,
    setExercise,
    setExperienceMode,
  } = useRitualStore();
  const techniques = useEnabledTechniques();
  const [impulsePrefilled] = useState(() => impulse.trim().length > 0);
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [byokConfigured, setByokConfigured] = useState(false);
  const [activeSeason, setActiveSeason] = useState<SeasonRun | null>(null);

  useEffect(() => {
    void resolveByokCredentials()
      .then((c) => setByokConfigured(Boolean(c)))
      .catch(() => setByokConfigured(false));
    void applyActiveSeasonToRitual().then(setActiveSeason);
  }, []);

  async function handleContinue() {
    if (!impulse.trim() || !technique) return;

    setLoading(true);
    setError(null);
    setOfflineMode(false);
    try {
      const result = await generateExercise(
        impulse.trim(),
        technique,
        durationMinutes
      );
      setExercise(
        result.exercise,
        durationMinutes,
        result.source,
        result.keywords,
        result.fallbackNote,
        result.development
      );
      if (result.source === "fallback") {
        setOfflineMode(true);
      }
      router.push(ROUTES.exercise);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("impulse.errorUnexpected");
      setError(message);
      showAlert(t("impulse.errorTitle"), message);
    } finally {
      setLoading(false);
    }
  }

  const canContinue = impulse.trim().length > 0 && technique !== null;

  const subtitle = impulsePrefilled
    ? t("impulse.subtitlePrefilled")
    : t("impulse.subtitle");

  return (
    <ScreenContainer refreshable compactTop>
      <ScreenNavBar backLabel={t("nav.backHome")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("impulse.heroLabel")}
        title={t("impulse.heroTitle")}
        accent={t("impulse.heroAccent")}
        description={subtitle}
        className="mb-4"
      />

      <RitualProgressBar current="ritual" />

      <ExperienceModeSelector
        value={experienceMode}
        onChange={setExperienceMode}
      />

      {activeSeason ? (
        <AccentCard className="mb-6">
          <Text className="text-sage-700 text-sm leading-6">
            {t("impulse.seasonNotice", { title: activeSeason.title })}
          </Text>
        </AccentCard>
      ) : null}

      {impulsePrefilled && (
        <AccentCard className="mb-6">
          <Text className="text-sage-700 text-sm leading-6">
            {t("impulse.readyNotice")}
          </Text>
        </AccentCard>
      )}

      {offlineMode && (
        <Text className="text-amber-700 text-xs mb-3 leading-5">
          {localExerciseBannerMessage({
            fallbackNote: exerciseFallbackNote,
            byokConfigured,
          })}
        </Text>
      )}

      <ContentCard className="mb-8 px-0 py-0 overflow-hidden">
        <TextInput
          value={impulse}
          onChangeText={setImpulse}
          placeholder={t("impulse.placeholder")}
          placeholderTextColor="#B8A090"
          multiline
          accessibilityLabel={t("impulse.inputA11y")}
          className="px-5 py-4 text-sand-800 text-base min-h-[100px]"
        />
      </ContentCard>

      <Text className="text-sand-600 text-sm mb-2 font-medium">
        {t("impulse.techniqueLabel")}
      </Text>
      <TechniquePicker
        selected={technique}
        selectedLabel={techniqueLabel}
        onSelect={setTechnique}
        techniques={techniques}
      />

      {technique && !isAiAnalysisSupported(technique) && !byokConfigured && (
        <Text className="text-amber-700 text-xs mt-2 mb-1 leading-5">
          {t("impulse.noKeyNotice")}
        </Text>
      )}
      {technique && !isAiAnalysisSupported(technique) && byokConfigured && (
        <Text className="text-sage-700 text-xs mt-2 mb-1 leading-5">
          {t("impulse.keyNotice")}
        </Text>
      )}

      <Text className="text-sand-600 text-sm mb-2 mt-5 font-medium">
        {t("impulse.durationLabel")}
      </Text>
      <DurationPicker
        selected={durationMinutes}
        onSelect={setDurationMinutes}
      />

      <View className="mt-auto pt-8 gap-4">
        {error && (
          <Text className="text-red-500 text-sm text-center leading-5 px-2">
            {error}
          </Text>
        )}
        <View className="items-center">
          <View className="w-1/2">
            <PrimaryButton
              label={loading ? t("impulse.ctaLoading") : t("impulse.cta")}
              onPress={handleContinue}
              disabled={!canContinue || loading}
            />
          </View>
        </View>
        {loading && (
          <View className="mt-2 items-center">
            <ActivityIndicator color="#6B8F71" />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
