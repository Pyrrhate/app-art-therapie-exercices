import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import {
  CustomDepthSelector,
  CustomExerciseFilters,
} from "@/components/custom";
import { WorkflowStepTransition } from "@/components/experience";
import { AccentCard } from "@/components/ui/Card";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import { ApiError } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import {
  generateCustomExercise,
  isCustomSessionComplete,
} from "@/lib/custom";
import { EMPTY_INTEGRATION_ANSWERS, EMPTY_SECOND_ROUND_ANSWERS } from "@/lib/experience/types";
import { navigateHome } from "@/lib/navigation";
import { EMPTY_USER_ANSWERS } from "@/lib/multimodal/types";
import { ROUTES } from "@/lib/routes";
import { useRitualStore } from "@/lib/store";

export default function CustomWorkspaceScreen() {
  const {
    customSessionConfig,
    durationMinutes,
    setCustomSessionConfig,
    setImpulse,
    setTechnique,
    setExperienceMode,
    setExercise,
  } = useRitualStore();

  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = isCustomSessionComplete(customSessionConfig);

  async function handleGenerate() {
    if (!canGenerate || loading) return;

    setLoading(true);
    setError(null);
    setOfflineMode(false);

    useRitualStore.setState({
      currentRound: 1,
      isSecondRoundPrep: false,
      round1Snapshot: null,
      transitionAnswers: { ...EMPTY_SECOND_ROUND_ANSWERS },
      sessionExerciseId: "",
      photoUri: null,
      reflection: null,
      openQuestions: [],
      followUpExercise: null,
      writtenText: "",
      exerciseSource: null,
      preAnswers: { ...EMPTY_USER_ANSWERS },
      postAnswers: { ...EMPTY_INTEGRATION_ANSWERS },
    });

    try {
      const result = await generateCustomExercise(
        customSessionConfig,
        durationMinutes
      );

      setImpulse(result.impulse);
      setTechnique(result.technique);
      setExperienceMode(customSessionConfig.depth);
      setExercise(
        result.exercise,
        result.durationMinutes,
        result.source,
        result.keywords
      );

      if (result.source === "fallback") {
        setOfflineMode(true);
      }

      router.push(ROUTES.exercise);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Une erreur inattendue est survenue. Réessayez dans un instant.";
      setError(message);
      showAlert("Impossible de générer", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer refreshable compactTop>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <PastekScreenHero
        label="Sur-mesure"
        title="Mode "
        accent="Sur-Mesure"
        description="Composez votre séance en choisissant thématique, émotion, objectif et technique — puis laissez l'exercice émerger."
        className="mb-4"
      />

      {offlineMode && (
        <Text className="text-amber-700 text-xs mb-3 leading-5">
          Mode local actif — exercice guidé hors ligne.
        </Text>
      )}

      <WorkflowStepTransition stepKey={loading ? "generating" : "form"}>
        {loading ? (
          <View className="items-center justify-center py-16 gap-4">
            <ActivityIndicator color="#6B8F71" size="large" />
            <Text className="text-sage-600 text-sm text-center leading-6 px-6">
              Nous composons un exercice aligné avec vos critères…
            </Text>
          </View>
        ) : (
          <View>
            <AccentCard className="mb-6">
              <Text className="text-sage-700 text-sm leading-6">
                Chaque critère affine la proposition. Vous pourrez ensuite créer
                et accueillir votre réflexion selon le rythme choisi.
              </Text>
            </AccentCard>

            <CustomExerciseFilters
              value={customSessionConfig}
              onChange={(patch) => setCustomSessionConfig(patch)}
            />

            <CustomDepthSelector
              value={customSessionConfig.depth}
              onChange={(depth) => setCustomSessionConfig({ depth })}
            />
          </View>
        )}
      </WorkflowStepTransition>

      {!loading && (
        <View className="mt-auto pt-8 gap-4">
          {error && (
            <Text className="text-red-500 text-sm text-center leading-5 px-2">
              {error}
            </Text>
          )}
          <PrimaryButton
            label="Générer mon exercice sur-mesure"
            onPress={() => void handleGenerate()}
            disabled={!canGenerate}
          />
        </View>
      )}
    </ScreenContainer>
  );
}
