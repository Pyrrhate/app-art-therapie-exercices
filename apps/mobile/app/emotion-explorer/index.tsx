import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmotionDetailBar } from "@/components/emotion-explorer/EmotionDetailBar";
import { EmotionGrid } from "@/components/emotion-explorer/EmotionGrid";
import { QuadrantPicker } from "@/components/emotion-explorer/QuadrantPicker";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { AccentCard } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayText";
import { PrimaryButton } from "@/components/ui/Button";
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

export default function EmotionExplorerScreen() {
  const insets = useSafeAreaInsets();
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

  const isDark = phase === "quadrant";
  const paddingTop = Math.max(insets.top, Platform.OS === "web" ? 48 : 56);

  return (
    <View
      className={`flex-1 ${isDark ? "bg-sand-900" : "bg-sand-50"}`}
      style={Platform.OS === "web" ? { minHeight: 0, flex: 1 } : { flex: 1 }}
    >
      <View
        className="px-6"
        style={{ paddingTop, maxWidth: 680, width: "100%", alignSelf: "center" }}
      >
        <ScreenNavBar
          backLabel="← Retour"
          onBack={handleBack}
          tone={isDark ? "light" : "default"}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 32),
          maxWidth: 680,
          width: "100%",
          alignSelf: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className={`text-sm uppercase tracking-widest mb-2 ${
            isDark ? "text-sage-300" : "text-sage-500"
          }`}
        >
          Explorateur émotionnel
        </Text>
        <DisplayTitle
          className={`mb-4 ${isDark ? "text-sand-100" : "text-sand-800"}`}
        >
          {phase === "quadrant"
            ? "Comment vous sentez-vous ?"
            : quadrant?.title ?? "Précisez votre émotion"}
        </DisplayTitle>

        {phase === "quadrant" && (
          <QuadrantPicker
            quadrants={EMOTION_QUADRANTS}
            onSelect={handleSelectQuadrant}
            theme="dark"
          />
        )}

        {phase === "emotion" && quadrant && (
          <View>
            <Text className="text-sand-600 text-sm leading-6 mb-4">
              Choisissez le mot qui se rapproche le plus de votre ressenti —
              puis passez à l&apos;exercice.
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher une émotion…"
              placeholderTextColor="#A89F91"
              accessibilityLabel="Rechercher une émotion"
              className="bg-white border border-sand-200 rounded-2xl px-4 py-3 min-h-[48px] text-sand-800 text-base mb-4"
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
                  <Text className="text-sand-700 text-sm leading-6">
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
      </ScrollView>
    </View>
  );
}
