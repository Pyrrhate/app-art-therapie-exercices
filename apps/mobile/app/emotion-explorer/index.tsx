import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  View,
} from "react-native";
import { EmotionDetailBar } from "@/components/emotion-explorer/EmotionDetailBar";
import { EmotionGrid } from "@/components/emotion-explorer/EmotionGrid";
import { QuadrantPicker } from "@/components/emotion-explorer/QuadrantPicker";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { getTechniqueLabel } from "@/constants";
import { ApiError } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import {
  buildExerciseContext,
  EMOTION_QUADRANTS,
  getEmotionsForQuadrant,
  searchEmotions,
  type Emotion,
  type EmotionExplorerPhase,
  type EmotionQuadrant,
} from "@/lib/emotion-explorer";
import { startExerciseFromImpulse } from "@/lib/fil/bridges";
import { navigateHome } from "@/lib/navigation";
import { textMuted, textSecondary } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

export default function EmotionExplorerScreen() {
  const isDark = useIsDark();
  const [phase, setPhase] = useState<EmotionExplorerPhase>("quadrant");
  const [quadrant, setQuadrant] = useState<EmotionQuadrant | null>(null);
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [search, setSearch] = useState("");
  const [startingExercise, setStartingExercise] = useState(false);
  const [completed, setCompleted] = useState(false);

  const emotions = useMemo(() => {
    if (search.trim()) return searchEmotions(search);
    if (!quadrant) return [];
    return getEmotionsForQuadrant(quadrant.id);
  }, [quadrant, search]);

  function handleSelectQuadrant(next: EmotionQuadrant) {
    setQuadrant(next);
    setSelected(null);
    setSearch("");
    setPhase("emotion");
  }

  function handleBack() {
    if (phase === "emotion") {
      setPhase("quadrant");
      setQuadrant(null);
      setSelected(null);
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
      setCompleted(true);
    } catch (error) {
      showAlert(
        "Impossible de continuer",
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Une erreur est survenue. Réessayez dans un instant."
      );
    } finally {
      setStartingExercise(false);
    }
  }

  const techniqueLabel = selected
    ? getTechniqueLabel(buildExerciseContext(selected).technique)
    : null;

  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720}>
      <ScreenNavBar backLabel="← Retour" onBack={handleBack} />

      {phase === "quadrant" ? (
        <PastekScreenHero
          label="Explorateur émotionnel"
          title={"Comment vous\n"}
          accent="sentez-vous ?"
          className="mb-6"
        />
      ) : (
        <PastekScreenHero
          label="Explorateur émotionnel"
          title="Précisez "
          accent="votre émotion"
          description={
            quadrant
              ? `${quadrant.title} — choisissez le mot qui se rapproche le plus de votre ressenti.`
              : undefined
          }
          className="mb-6"
        />
      )}

      {phase === "quadrant" && (
        <>
          <QuadrantPicker
            quadrants={EMOTION_QUADRANTS}
            onSelect={handleSelectQuadrant}
          />
          <Text
            className={`text-sm text-center leading-6 mt-2 mb-4 px-4 ${textMuted(isDark)}`}
          >
            Prenez le temps qu&apos;il faut. Aucun mauvais choix.
          </Text>
        </>
      )}

      {phase === "emotion" && quadrant && (
        <View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une émotion…"
            placeholderTextColor={isDark ? "#7A6558" : "#A89F91"}
            accessibilityLabel="Rechercher une émotion"
            className={`border rounded-2xl px-5 py-3.5 min-h-[48px] text-base mb-6 ${
              isDark
                ? "bg-sand-800 border-sand-700 text-sand-100"
                : "bg-white/80 border-sand-200 text-sand-900"
            }`}
          />

          <EmotionGrid
            emotions={emotions}
            quadrant={quadrant}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />

          {selected && (
            <View className="gap-4 mt-2">
              <View className="items-center gap-1 mb-1">
                <Text className={`text-sm ${textMuted(isDark)}`}>
                  Vous avez choisi
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
                Technique {techniqueLabel} — guidée par votre ressenti.
              </Text>

              <PrimaryButton
                label={
                  startingExercise ? "Préparation…" : "Passer à l'exercice"
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

              {!completed && (
                <AddToFilBar
                  entry={{
                    source: "emotion-explorer",
                    summary: `Explorateur — ${selected.label}`,
                    detail: selected.description,
                    metadata: {
                      impulse: buildExerciseContext(selected).impulse,
                      technique: buildExerciseContext(selected).technique,
                    },
                  }}
                />
              )}
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}
