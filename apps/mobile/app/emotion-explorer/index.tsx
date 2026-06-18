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
import { AccentCard } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayText";
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
import { textSecondary } from "@/lib/themeClasses";
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
    <ScreenContainer scrollable refreshable>
      <ScreenNavBar backLabel="← Retour" onBack={handleBack} />

      <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
        Explorateur émotionnel
      </Text>
      <DisplayTitle className="mb-4">
        {phase === "quadrant"
          ? "Comment vous sentez-vous ?"
          : quadrant?.title ?? "Précisez votre émotion"}
      </DisplayTitle>

      {phase === "quadrant" && (
        <QuadrantPicker
          quadrants={EMOTION_QUADRANTS}
          onSelect={handleSelectQuadrant}
        />
      )}

      {phase === "emotion" && quadrant && (
        <View>
          <Text className={`text-sm leading-6 mb-4 ${textSecondary(isDark)}`}>
            Choisissez le mot qui se rapproche le plus de votre ressenti —
            puis passez à l&apos;exercice.
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une émotion…"
            placeholderTextColor={isDark ? "#7A6558" : "#A89F91"}
            accessibilityLabel="Rechercher une émotion"
            className={`border rounded-2xl px-4 py-3 min-h-[48px] text-base mb-4 ${
              isDark
                ? "bg-sand-800 border-sand-700 text-sand-100"
                : "bg-white border-sand-200 text-sand-800"
            }`}
          />

          <EmotionGrid
            emotions={emotions}
            quadrant={quadrant}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />

          {selected && (
            <>
              <EmotionDetailBar
                emotion={selected}
                quadrant={quadrant}
                loading={startingExercise}
                onContinue={() => void handleStartExercise()}
              />

              <AccentCard className="mt-4">
                <Text className="text-sage-600 text-xs uppercase tracking-wider mb-1">
                  Exercice suggéré
                </Text>
                <Text className={`text-sm leading-6 ${textSecondary(isDark)}`}>
                  Technique {techniqueLabel} — guidée par votre ressenti «{" "}
                  {selected.label} ».
                </Text>
              </AccentCard>

              <View className="mt-4">
                <PrimaryButton
                  label={
                    startingExercise ? "Préparation…" : "Passer à l'exercice"
                  }
                  onPress={() => void handleStartExercise()}
                  disabled={startingExercise}
                />
              </View>

              {startingExercise && (
                <View className="mt-3 items-center">
                  <ActivityIndicator color="#6B8F71" />
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
            </>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}
