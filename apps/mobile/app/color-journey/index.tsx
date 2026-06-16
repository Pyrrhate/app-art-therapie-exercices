import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ChromaticWheel } from "@/components/color-journey/ChromaticWheel";
import { JourneyProgress } from "@/components/color-journey/JourneyProgress";
import { ReflectionPanel } from "@/components/color-journey/ReflectionPanel";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
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
import { startRitualFromImpulse } from "@/lib/fil/bridges";
import { navigateHome } from "@/lib/navigation";

export default function ColorJourneyScreen() {
  const [phase, setPhase] = useState<ColorJourneyPhase>("choosing");
  const [turn, setTurn] = useState(1);
  const [history, setHistory] = useState<ColorChoice[]>([]);
  const [lastReflection, setLastReflection] = useState<JourneyReflection | null>(
    null
  );
  const [synthesis, setSynthesis] = useState<JourneySynthesis | null>(null);

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

  function handleRestart() {
    setPhase("choosing");
    setTurn(1);
    setHistory([]);
    setLastReflection(null);
    setSynthesis(null);
  }

  function buildImpulseFromHistory(choices: ColorChoice[]): string {
    const labels = choices.map((c) => c.label).join(", ");
    return `Palette intérieure : ${labels}`;
  }

  function handleEarlyExitToExercise() {
    startRitualFromImpulse(buildImpulseFromHistory(history), "painting");
  }

  const paletteHexes = history.map((h) => h.hex);

  return (
    <ScreenContainer scrollable={false}>
      <ScreenNavBar backLabel="← Accueil" onBack={navigateHome} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sage-500 text-sm uppercase tracking-widest mb-2">
          Palette intérieure
        </Text>
        <Text className="text-3xl font-light text-sand-800 mb-2 leading-tight">
          Trois teintes sur la roue
        </Text>
        <Text className="text-sand-500 text-base leading-6 mb-4">
          Choisissez vos couleurs sur le cercle chromatique — complémentaire,
          triade : la théorie guide, vous décidez.
        </Text>

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
                  <View className="mt-4">
                    <PrimaryButton
                      label="Passer à l'exercice avec mes teintes"
                      onPress={handleEarlyExitToExercise}
                      variant="ghost"
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
                  <View className="mt-2">
                    <PrimaryButton
                      label="Passer à l'exercice avec mes teintes"
                      onPress={handleEarlyExitToExercise}
                      variant="ghost"
                    />
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {phase === "complete" && synthesis && (
          <View>
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
                    <View
                      className="rounded-full border border-sand-200 mb-1"
                      style={{ width: 40, height: 40, backgroundColor: choice.hex }}
                    />
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
                  label: "Passer à l'exercice",
                  onPress: () =>
                    startRitualFromImpulse(
                      synthesis.suggestedImpulse,
                      "painting"
                    ),
                  variant: "primary",
                },
              ]}
            />

            <AddToFilBar
              entry={{
                source: "color-journey",
                summary: "Palette intérieure — 3 teintes",
                detail: synthesis.summary.slice(0, 200),
                metadata: { colors: paletteHexes, impulse: synthesis.suggestedImpulse },
              }}
            />

            <View className="mt-4">
              <PrimaryButton
                label="Recommencer"
                onPress={handleRestart}
                variant="ghost"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
