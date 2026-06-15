import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ColorProposalCard } from "@/components/color-journey/ColorProposalCard";
import { JourneyProgress } from "@/components/color-journey/JourneyProgress";
import { ReflectionPanel } from "@/components/color-journey/ReflectionPanel";
import { AddToFilBar } from "@/components/fil/AddToFilBar";
import { CreativeBridge } from "@/components/fil/CreativeBridge";
import { InlineNotice } from "@/components/InlineNotice";
import { ZenWaitIndicator } from "@/components/ZenWaitIndicator";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import {
  chooseColorJourney,
  ApiError,
  startColorJourney,
  synthesizeColorJourney,
} from "@/lib/api";
import {
  COLOR_JOURNEY_TURN_COUNT,
  getDimensionForTurn,
  type ColorChoice,
  type ColorJourneyPhase,
  type ColorProposal,
  type JourneyReflection,
  type JourneySynthesis,
} from "@/lib/color-journey";
import {
  startRitualFromImpulse,
} from "@/lib/fil/bridges";
import { navigateHome } from "@/lib/navigation";

export default function ColorJourneyScreen() {
  const [phase, setPhase] = useState<ColorJourneyPhase>("intro");
  const [mood, setMood] = useState("");
  const [intro, setIntro] = useState("");
  const [turn, setTurn] = useState(1);
  const [dimensionTitle, setDimensionTitle] = useState("");
  const [dimensionSubtitle, setDimensionSubtitle] = useState("");
  const [contextNote, setContextNote] = useState<string | undefined>();
  const [proposals, setProposals] = useState<ColorProposal[]>([]);
  const [history, setHistory] = useState<ColorChoice[]>([]);
  const [lastReflection, setLastReflection] = useState<JourneyReflection | null>(
    null
  );
  const [synthesis, setSynthesis] = useState<JourneySynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [notice, setNotice] = useState<{
    type: "error" | "info";
    message: string;
  } | null>(null);

  async function handleStart() {
    setLoading(true);
    setNotice(null);
    try {
      const result = await startColorJourney({
        mood: mood.trim() || undefined,
        seedWord: mood.trim() || undefined,
      });
      setOfflineMode(result.source === "fallback");
      setIntro(result.intro);
      setTurn(result.turn);
      setDimensionTitle(result.dimension.title);
      setDimensionSubtitle(result.dimension.subtitle);
      setContextNote(result.contextNote);
      setProposals(result.proposals);
      setPhase("choosing");
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "Impossible de démarrer le parcours.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleChoose(proposal: ColorProposal) {
    if (loading) return;
    setLoading(true);
    setNotice(null);

    const dimensionId = getDimensionForTurn(turn).id;

    try {
      const result = await chooseColorJourney({
        turn,
        chosen: proposal,
        history,
        mood: mood.trim() || undefined,
        seedWord: mood.trim() || undefined,
      });

      if (result.source === "fallback") setOfflineMode(true);

      const choice: ColorChoice = {
        hex: proposal.hex,
        label: proposal.label,
        dimensionId,
      };
      const nextHistory = [...history, choice];
      setHistory(nextHistory);

      const reflection: JourneyReflection = {
        reflection: result.reflection,
        psychology: result.psychology,
        theory: result.theory,
        question: result.question,
        turn,
        chosen: proposal,
      };
      setLastReflection(reflection);
      setPhase("reflecting");

      if (turn >= COLOR_JOURNEY_TURN_COUNT) {
        const synth = await synthesizeColorJourney({
          history: nextHistory,
          mood: mood.trim() || undefined,
        });
        if (synth.source === "fallback") setOfflineMode(true);
        setSynthesis(synth);
      } else if (result.nextTurn && result.proposals?.length) {
        setTurn(result.nextTurn);
        setDimensionTitle(result.nextDimension?.title ?? "");
        setDimensionSubtitle(result.nextDimension?.subtitle ?? "");
        setContextNote(result.contextNote);
        setProposals(result.proposals);
      }
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "Impossible d'enregistrer ce choix.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleContinueAfterReflection() {
    if (turn >= COLOR_JOURNEY_TURN_COUNT && synthesis) {
      setPhase("complete");
      return;
    }
    setLastReflection(null);
    setPhase("choosing");
  }

  function handleRestart() {
    setPhase("intro");
    setMood("");
    setIntro("");
    setTurn(1);
    setProposals([]);
    setHistory([]);
    setLastReflection(null);
    setSynthesis(null);
    setOfflineMode(false);
    setNotice(null);
  }

  function buildImpulseFromHistory(choices: ColorChoice[]): string {
    const labels = choices.map((c) => c.label).join(", ");
    return `Palette intérieure : ${labels}`;
  }

  function handleEarlyExitToExercise() {
    startRitualFromImpulse(buildImpulseFromHistory(history), "painting");
  }

  const paletteHexes = history.map((h) => h.hex);
  const canExitEarly = history.length >= 3;

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
          Huit teintes, en dialogue
        </Text>
        <Text className="text-sand-500 text-base leading-6 mb-4">
          Un dialogue réflexif sur huit teintes pour nourrir une impulsion,
          puis passer à l&apos;exercice créatif.
        </Text>

        {offlineMode && (
          <Text className="text-sand-500 text-xs mb-3 leading-5">
            Suggestions locales — le parcours continue en douceur.
          </Text>
        )}

        {notice && (
          <InlineNotice
            type={notice.type}
            message={notice.message}
            onDismiss={() => setNotice(null)}
          />
        )}

        {phase === "intro" && (
          <View>
            <Text className="text-sand-600 text-sm leading-6 mb-4">
              Un mot d&apos;humeur (optionnel) personnalise vos propositions de
              couleurs — puis vous passerez à l&apos;exercice avec votre palette.
            </Text>
            <Text className="text-sand-700 font-medium mb-2">
              Comment vous sentez-vous ? (optionnel)
            </Text>
            <TextInput
              className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sand-800 text-base mb-4"
              placeholder="Un mot, une humeur, une couleur…"
              placeholderTextColor="#A89F91"
              value={mood}
              onChangeText={setMood}
              editable={!loading}
            />
            <PrimaryButton
              label={loading ? "Préparation…" : "Commencer le parcours"}
              onPress={handleStart}
              disabled={loading}
            />
          </View>
        )}

        {(phase === "choosing" || phase === "reflecting") && (
          <View>
            <JourneyProgress currentTurn={turn} history={history} />

            {phase === "choosing" && (
              <>
                {intro && turn === 1 ? (
                  <Text className="text-sand-600 text-sm leading-6 mb-4">
                    {intro}
                  </Text>
                ) : null}

                <View className="bg-sage-50 rounded-2xl border border-sage-100 px-4 py-4 mb-4">
                  <Text className="text-sage-700 font-medium text-lg mb-1">
                    {dimensionTitle}
                  </Text>
                  <Text className="text-sand-600 text-sm leading-6">
                    {dimensionSubtitle}
                  </Text>
                  {contextNote ? (
                    <Text className="text-sand-400 text-xs mt-2 leading-5">
                      {contextNote}
                    </Text>
                  ) : null}
                </View>

                {loading && <ZenWaitIndicator active />}

                {proposals.map((proposal) => (
                  <ColorProposalCard
                    key={`${proposal.hex}-${proposal.label}`}
                    proposal={proposal}
                    onPress={() => void handleChoose(proposal)}
                    disabled={loading}
                  />
                ))}

                {canExitEarly && (
                  <View className="mt-2">
                    <PrimaryButton
                      label="Passer à l'exercice avec mes teintes"
                      onPress={handleEarlyExitToExercise}
                      variant="ghost"
                      disabled={loading}
                    />
                  </View>
                )}
              </>
            )}

            {phase === "reflecting" && lastReflection && (
              <>
                <ReflectionPanel data={lastReflection} />
                {loading && !synthesis && turn >= COLOR_JOURNEY_TURN_COUNT && (
                  <View className="items-center py-4">
                    <ActivityIndicator color="#6B8F71" />
                    <Text className="text-sand-400 text-sm mt-2">
                      Synthèse de votre palette…
                    </Text>
                  </View>
                )}
                <PrimaryButton
                  label={
                    turn >= COLOR_JOURNEY_TURN_COUNT
                      ? "Voir ma palette"
                      : "Continuer"
                  }
                  onPress={handleContinueAfterReflection}
                  disabled={loading && turn >= COLOR_JOURNEY_TURN_COUNT && !synthesis}
                />
                {canExitEarly && turn < COLOR_JOURNEY_TURN_COUNT && (
                  <View className="mt-2">
                    <PrimaryButton
                      label="Passer à l'exercice avec mes teintes"
                      onPress={handleEarlyExitToExercise}
                      variant="ghost"
                      disabled={loading}
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
                summary: "Palette intérieure — 8 teintes",
                detail: synthesis.summary.slice(0, 200),
                metadata: { colors: paletteHexes, impulse: synthesis.suggestedImpulse },
              }}
            />

            <View className="mt-4">
              <PrimaryButton
                label="Recommencer un parcours"
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
