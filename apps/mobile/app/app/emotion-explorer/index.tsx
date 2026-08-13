import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { EmotionDetailBar } from "@/components/emotion-explorer/EmotionDetailBar";
import { EmotionGrid } from "@/components/emotion-explorer/EmotionGrid";
import { QuadrantPicker } from "@/components/emotion-explorer/QuadrantPicker";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { localizedTechniqueLabel } from "@/lib/techniques/labels";
import { ApiError } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import {
  buildExerciseContext,
  getEmotionQuadrants,
  getEmotionsForQuadrant,
  searchEmotions,
  type Emotion,
  type EmotionExplorerPhase,
  type EmotionQuadrant,
} from "@/lib/emotion-explorer";
import { startExerciseFromImpulse } from "@/lib/fil/bridges";
import { recordFilEntry } from "@/lib/fil/record";
import { useLanguageStore } from "@/lib/i18n/languageStore";
import { navigateHome } from "@/lib/navigation";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function EmotionExplorerScreen() {
  const isDark = useIsDark();
  const { t } = useTranslation("amorces");
  const language = useLanguageStore((s) => s.language);
  const [phase, setPhase] = useState<EmotionExplorerPhase>("quadrant");
  const [quadrantId, setQuadrantId] = useState<EmotionQuadrant["id"] | null>(
    null
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [startingExercise, setStartingExercise] = useState(false);
  const filRecordedFor = useRef<string | null>(null);

  const quadrants = useMemo(() => getEmotionQuadrants(language), [language]);
  const quadrant = quadrantId
    ? (quadrants.find((q) => q.id === quadrantId) ?? null)
    : null;

  const emotions = useMemo(() => {
    if (search.trim()) return searchEmotions(search, language);
    if (!quadrantId) return [];
    return getEmotionsForQuadrant(quadrantId, language);
  }, [quadrantId, search, language]);

  const selected = selectedId
    ? (emotions.find((e) => e.id === selectedId) ?? null)
    : null;

  useEffect(() => {
    if (!selected || filRecordedFor.current === selected.id) return;
    filRecordedFor.current = selected.id;
    const ctx = buildExerciseContext(selected);
    void recordFilEntry({
      source: "emotion-explorer",
      summary: t("emotionExplorer.filSummary", { label: selected.label }),
      detail: selected.description,
      metadata: { impulse: ctx.impulse, technique: ctx.technique },
    });
  }, [selected, t]);

  function handleSelectQuadrant(next: EmotionQuadrant) {
    setQuadrantId(next.id);
    setSelectedId(null);
    setSearch("");
    setPhase("emotion");
  }

  function handleBack() {
    if (phase === "emotion") {
      setPhase("quadrant");
      setQuadrantId(null);
      setSelectedId(null);
      setSearch("");
      return;
    }
    navigateHome();
  }

  async function handleStartExercise() {
    if (!selected || startingExercise) return;
    const { impulse, technique } = buildExerciseContext(selected);
    setStartingExercise(true);
    try {
      await startExerciseFromImpulse(impulse, technique);
    } catch (error) {
      showAlert(
        t("errors.cannotContinue"),
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("errors.generic")
      );
    } finally {
      setStartingExercise(false);
    }
  }

  const techniqueLabel = selected
    ? localizedTechniqueLabel(buildExerciseContext(selected).technique)
    : null;

  return (
    <ScreenContainer
      scrollable={phase !== "quadrant"}
      refreshable={phase !== "quadrant"}
      contentMaxWidth={720}
      compactTop
    >
      <ScreenNavBar backLabel={t("nav.back")} onBack={handleBack} />

      {phase === "quadrant" ? (
        <PastekScreenHero
          label={t("emotionExplorer.heroLabel")}
          title={t("emotionExplorer.quadrantTitle")}
          accent={t("emotionExplorer.quadrantAccent")}
          className="mb-6"
        />
      ) : (
        <PastekScreenHero
          label={t("emotionExplorer.heroLabel")}
          title={t("emotionExplorer.emotionTitle")}
          accent={t("emotionExplorer.emotionAccent")}
          description={
            quadrant
              ? t("emotionExplorer.emotionDescription", {
                  quadrant: quadrant.title,
                })
              : undefined
          }
          className="mb-6"
        />
      )}

      {phase === "quadrant" && (
        <View className="flex-1 justify-between">
          <QuadrantPicker
            fillHeight
            quadrants={quadrants}
            onSelect={handleSelectQuadrant}
          />
          <Text
            className={`text-sm text-center leading-6 mt-4 mb-2 px-4 ${textMuted(isDark)}`}
          >
            {t("emotionExplorer.noWrongChoice")}
          </Text>
        </View>
      )}

      {phase === "emotion" && quadrant && (
        <View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("emotionExplorer.searchPlaceholder")}
            placeholderTextColor={isDark ? "#7A6558" : "#A89F91"}
            accessibilityLabel={t("emotionExplorer.searchLabel")}
            className={`border rounded-2xl px-5 py-3.5 min-h-[48px] text-base mb-6 ${
              isDark
                ? "bg-sand-800 border-sand-700 text-sand-100"
                : "bg-white/80 border-sand-200 text-sand-900"
            }`}
          />

          <EmotionGrid
            emotions={emotions}
            quadrant={quadrant}
            selectedId={selectedId}
            onSelect={(emotion) => setSelectedId(emotion.id)}
          />

          {selected && (
            <View className="gap-4 mt-2">
              <View className="items-center gap-1 mb-1">
                <Text className={`text-sm ${textMuted(isDark)}`}>
                  {t("emotionExplorer.youChose")}
                </Text>
                <Text
                  className="font-display text-xl text-sage-500 text-center"
                  style={{ letterSpacing: -0.3 }}
                >
                  {selected.label}
                </Text>
              </View>

              <EmotionDetailBar emotion={selected} quadrant={quadrant} />

              <Text className={`text-sm text-center leading-6 ${textSecondary(isDark)}`}>
                {t("emotionExplorer.techniqueLine", {
                  technique: techniqueLabel,
                })}
              </Text>

              <PrimaryButton
                label={
                  startingExercise
                    ? t("emotionExplorer.preparing")
                    : t("emotionExplorer.toExercise")
                }
                onPress={() => void handleStartExercise()}
                disabled={startingExercise}
                align="center"
              />

              {startingExercise && (
                <View className="items-center">
                  <ActivityIndicator color="#496349" />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}
