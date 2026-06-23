import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ChromaticWheel } from "@/components/color-journey/ChromaticWheel";
import { ColorSwatch } from "@/components/color-journey/ColorSwatch";
import { JourneyProgress } from "@/components/color-journey/JourneyProgress";
import { ReflectionPanel } from "@/components/color-journey/ReflectionPanel";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import {
  COLOR_JOURNEY_TURN_COUNT,
  getDimensionForTurn,
  type ColorChoice,
  type ColorJourneyPhase,
  type JourneyReflection,
  type JourneySynthesis,
} from "@/lib/color-journey";
import { hexToColorLabel } from "@/lib/color-names";
import {
  buildReflection,
  buildSynthesis,
  getTurnGuidance,
} from "@/lib/color-journey/theory";
import { ApiError } from "@/lib/api";
import { showAlert } from "@/lib/alert";
import { startExerciseFromImpulse } from "@/lib/fil/bridges";
import { recordFilEntry } from "@/lib/fil/record";
import { navigateHome } from "@/lib/navigation";

export default function ColorJourneyScreen() {
  const [phase, setPhase] = useState<ColorJourneyPhase>("choosing");
  const [turn, setTurn] = useState(1);
  const [history, setHistory] = useState<ColorChoice[]>([]);
  const [lastReflection, setLastReflection] = useState<JourneyReflection | null>(
    null
  );
  const [synthesis, setSynthesis] = useState<JourneySynthesis | null>(null);
  const [startingExercise, setStartingExercise] = useState(false);
  const filRecordedRef = useRef(false);

  const guidance = getTurnGuidance(turn, history);
  const canExitEarly = history.length >= 2;

  function handleConfirmHex(hex: string) {
    const proposal = {
      hex,
      label: hexToColorLabel(hex),
      hint: "",
    };

    const dimensionId = getDimensionForTurn(turn).id;
    const choice: ColorChoice = {
      hex,
      label: proposal.label,
      dimensionId,
    };
    const nextHistory = [...history, choice];
    setHistory(nextHistory);

    const reflection = buildReflection(turn, proposal, history);
    setLastReflection(reflection);
    setPhase("reflecting");

    if (turn >= COLOR_JOURNEY_TURN_COUNT) {
      setSynthesis(buildSynthesis(nextHistory));
    }
  }

  function handleContinueAfterReflection() {
    if (turn >= COLOR_JOURNEY_TURN_COUNT && synthesis) {
      setPhase("complete");
      return;
    }
    setLastReflection(null);
    setTurn((t) => t + 1);
    setPhase("choosing");
  }

  function buildImpulseFromHistory(choices: ColorChoice[]): string {
    const labels = choices.map((c) => c.label).join(", ");
    return `Palette intérieure : ${labels}`;
  }

  async function handleStartExercise(impulse: string) {
    if (startingExercise || !impulse.trim()) return;
    setStartingExercise(true);
    try {
      await startExerciseFromImpulse(impulse, "painting");
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

  function handleEarlyExitToExercise() {
    void handleStartExercise(buildImpulseFromHistory(history));
  }

  const paletteHexes = history.map((h) => h.hex);

  useEffect(() => {
    if (phase !== "complete" || !synthesis || filRecordedRef.current) return;
    filRecordedRef.current = true;
    void recordFilEntry({
      source: "color-journey",
      summary: "Palette intérieure — 3 teintes",
      detail: synthesis.summary.slice(0, 200),
      metadata: { colors: paletteHexes, impulse: synthesis.suggestedImpulse },
    });
  }, [phase, synthesis, paletteHexes]);

  function handleRestart() {
    filRecordedRef.current = false;
    setPhase("choosing");
    setTurn(1);
    setHistory([]);
    setLastReflection(null);
    setSynthesis(null);
  }

  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720}>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <PastekScreenHero
        label="Palette intérieure"
        title="Trois teintes "
        accent="sur la roue"
        description="Choisissez vos couleurs sur le cercle chromatique — complémentaire, triade : la théorie guide, vous décidez."
        className="mb-4"
      />

      {(phase === "choosing" || phase === "reflecting") && (
        <View>
          <JourneyProgress currentTurn={turn} history={history} />

          {phase === "choosing" && (
            <>
              <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-4 mb-4">
                <Text className="text-sage-700 font-medium text-lg mb-1">
                  {guidance.title}
                </Text>
                <Text className="text-sand-600 text-sm leading-6">
                  {guidance.subtitle}
                </Text>
                <Text className="text-sand-400 text-xs mt-2 leading-5">
                  {guidance.theory}
                </Text>
              </View>

              <ChromaticWheel
                key={turn}
                highlightHues={guidance.highlightHues}
                highlightSpread={guidance.highlightSpread}
                onConfirm={handleConfirmHex}
              />

              {canExitEarly && (
                <View className="mt-4 mb-2">
                  <PrimaryButton
                    label="Passer à l'exercice avec mes teintes"
                    onPress={handleEarlyExitToExercise}
                    variant="ghost"
                    disabled={startingExercise}
                  />
                </View>
              )}
            </>
          )}

          {phase === "reflecting" && lastReflection && (
            <>
              <ReflectionPanel data={lastReflection} />
              <PrimaryButton
                label={
                  turn >= COLOR_JOURNEY_TURN_COUNT
                    ? "Voir ma palette"
                    : "Teinte suivante"
                }
                onPress={handleContinueAfterReflection}
              />
              {canExitEarly && turn < COLOR_JOURNEY_TURN_COUNT && (
                <View className="mt-2 mb-2">
                  <PrimaryButton
                    label="Passer à l'exercice avec mes teintes"
                    onPress={handleEarlyExitToExercise}
                    variant="ghost"
                    disabled={startingExercise}
                  />
                </View>
              )}
            </>
          )}
        </View>
      )}

      {phase === "complete" && synthesis && (
        <View className="pb-4">
          <JourneyProgress
            currentTurn={COLOR_JOURNEY_TURN_COUNT}
            history={history}
          />

          <View className="bg-white rounded-2xl border border-sand-200 px-5 py-5 mb-4">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-3">
              Votre palette intérieure
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-4">
              {history.map((choice) => (
                <View key={choice.hex + choice.label} className="items-center">
                  <ColorSwatch hex={choice.hex} size={40} className="mb-1" />
                  <Text className="text-sand-500 text-xs text-center max-w-[72px]">
                    {choice.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="text-sand-700 text-base leading-7">
              {synthesis.summary}
            </Text>
          </View>

          <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-4 mb-4">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              Votre impulsion
            </Text>
            <Text className="text-sand-800 text-lg font-light leading-7">
              {synthesis.suggestedImpulse}
            </Text>
          </View>

          <CreativeBridge
            title="Votre impulsion est prête"
            subtitle="Vos teintes deviennent une impulsion pour peindre ou explorer en technique mixte."
            actions={[
              {
                label: startingExercise
                  ? "Préparation…"
                  : "Passer à l'exercice",
                onPress: () =>
                  void handleStartExercise(synthesis.suggestedImpulse),
                variant: "primary",
                disabled: startingExercise,
              },
            ]}
          />

          {startingExercise && (
            <View className="mt-3 items-center">
              <ActivityIndicator color="#6B8F71" />
            </View>
          )}

          <View className="mt-4">
            <PrimaryButton
              label="Recommencer"
              onPress={handleRestart}
              variant="ghost"
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
