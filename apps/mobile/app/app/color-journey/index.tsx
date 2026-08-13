import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AmorceOutcomePanel } from "@/components/amorce/AmorceOutcomePanel";
import { ChromaticWheel } from "@/components/color-journey/ChromaticWheel";
import { ColorProposalCard } from "@/components/color-journey/ColorProposalCard";
import { ColorSwatch } from "@/components/color-journey/ColorSwatch";
import { JourneyProgress } from "@/components/color-journey/JourneyProgress";
import { ReflectionPanel } from "@/components/color-journey/ReflectionPanel";
import { PastekScreenHero } from "@/components/ui/PastekScreenHero";
import { PrimaryButton, ScreenContainer } from "@/components/ui/Button";
import { ScreenNavBar } from "@/components/ui/ScreenNavBar";
import {
  buildPaletteAugmentationContext,
  buildPaletteImpulse,
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
  buildProposalFromWheel,
  buildSynthesis,
  getTurnGuidance,
  getTurnProposals,
} from "@/lib/color-journey/theory";
import type { ColorProposal } from "@/lib/color-journey/types";
import { fetchColorJourneyMirror } from "@/lib/api";
import { recordFilEntry } from "@/lib/fil/record";
import { colorsToFilMetadata } from "@/lib/fil/nuancier";
import { navigateHome } from "@/lib/navigation";

export default function ColorJourneyScreen() {
  const { t, i18n } = useTranslation("amorces");
  const [phase, setPhase] = useState<ColorJourneyPhase>("choosing");
  const [turn, setTurn] = useState(1);
  const [history, setHistory] = useState<ColorChoice[]>([]);
  const [lastReflection, setLastReflection] = useState<JourneyReflection | null>(
    null
  );
  const [synthesis, setSynthesis] = useState<JourneySynthesis | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const filRecordedRef = useRef(false);
  const filPartialRef = useRef(false);

  const guidance = useMemo(
    () => getTurnGuidance(turn, history),
    [turn, history, i18n.language]
  );
  const proposals = useMemo(
    () => getTurnProposals(turn, history),
    [turn, history, i18n.language]
  );
  const canExitEarly = history.length >= 2;
  const augmentationContext = buildPaletteAugmentationContext(history);
  const impulse = buildPaletteImpulse(history);

  function handleConfirmChoice(proposal: ColorProposal) {
    const dimensionId = getDimensionForTurn(turn).id;
    const choice: ColorChoice = {
      hex: proposal.hex,
      label: proposal.label,
      dimensionId,
      mixRecipe: proposal.mixRecipe,
      paintId: proposal.paintId,
    };
    const nextHistory = [...history, choice];
    setHistory(nextHistory);

    const reflection = buildReflection(turn, proposal, history);
    setLastReflection(reflection);
    setPhase("reflecting");

    if (turn >= COLOR_JOURNEY_TURN_COUNT) {
      void finalizeSynthesis(nextHistory);
    }
  }

  function handleConfirmHex(hex: string) {
    const proposal = buildProposalFromWheel(turn, hex, history);
    handleConfirmChoice({ ...proposal, hex, label: hexToColorLabel(hex) });
  }

  async function finalizeSynthesis(nextHistory: ColorChoice[]) {
    setSynthesisLoading(true);
    const fallback = buildSynthesis(nextHistory);
    try {
      const result = await fetchColorJourneyMirror({
        mode: "synthesis",
        history: nextHistory,
      });
      setSynthesis({
        ...fallback,
        summary: result.mirror,
        source: result.source,
      });
    } catch {
      setSynthesis(fallback);
    } finally {
      setSynthesisLoading(false);
    }
  }

  function handleContinueAfterReflection() {
    if (turn >= COLOR_JOURNEY_TURN_COUNT) {
      setPhase("complete");
      return;
    }
    setLastReflection(null);
    setTurn((t) => t + 1);
    setPhase("choosing");
  }

  async function handleRequestMirror() {
    if (!lastReflection || mirrorLoading) return;
    setMirrorLoading(true);
    try {
      const result = await fetchColorJourneyMirror({
        mode: "turn",
        turn: lastReflection.turn,
        chosen: {
          hex: lastReflection.chosen.hex,
          label: lastReflection.chosen.label,
          dimensionId: getDimensionForTurn(lastReflection.turn).id,
        },
        history,
      });
      setLastReflection((prev) =>
        prev ? { ...prev, aiMirror: result.mirror } : prev
      );
    } finally {
      setMirrorLoading(false);
    }
  }

  const paletteHexes = history.map((h) => h.hex);
  const colorHints = useMemo(
    () => ({
      colorContext: augmentationContext,
      paletteColors: paletteHexes,
    }),
    [augmentationContext, paletteHexes]
  );

  useEffect(() => {
    if (history.length < 2 || filPartialRef.current) return;
    filPartialRef.current = true;
    const paletteMeta = colorsToFilMetadata(
      history.map((h) => ({ hex: h.hex, label: h.label }))
    );
    void recordFilEntry({
      source: "color-journey",
      summary: t("colorJourney.filSummaryPartial", { count: history.length }),
      detail: buildPaletteImpulse(history).slice(0, 200),
      metadata: {
        ...paletteMeta,
        impulse: buildPaletteImpulse(history),
        colorContext: buildPaletteAugmentationContext(history),
        paletteSource: "color-journey",
      },
    });
  }, [history, paletteHexes]);

  useEffect(() => {
    if (phase !== "complete" || !synthesis || filRecordedRef.current) return;
    filRecordedRef.current = true;
    const paletteMeta = colorsToFilMetadata(
      history.map((h) => ({ hex: h.hex, label: h.label }))
    );
    void recordFilEntry({
      source: "color-journey",
      summary: t("colorJourney.filSummaryComplete"),
      detail: synthesis.summary.slice(0, 200),
      metadata: {
        ...paletteMeta,
        impulse: synthesis.suggestedImpulse,
        colorContext: buildPaletteAugmentationContext(history),
        colorMirror: synthesis.source === "ai" ? synthesis.summary : undefined,
        paletteSource: "color-journey",
      },
    });
  }, [phase, synthesis, paletteHexes, history]);

  function handleRestart() {
    filRecordedRef.current = false;
    filPartialRef.current = false;
    setPhase("choosing");
    setTurn(1);
    setHistory([]);
    setLastReflection(null);
    setSynthesis(null);
    setMirrorLoading(false);
    setSynthesisLoading(false);
  }

  return (
    <ScreenContainer scrollable refreshable contentMaxWidth={720} compactTop>
      <ScreenNavBar backLabel={t("nav.home")} onBack={navigateHome} />

      <PastekScreenHero
        label={t("colorJourney.heroLabel")}
        title={t("colorJourney.heroTitle")}
        accent={t("colorJourney.heroAccent")}
        description={t("colorJourney.heroDescription")}
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

              {proposals.length > 0 && (
                <View className="mt-4">
                  <Text className="text-sand-500 text-xs uppercase tracking-wider mb-2 px-1">
                    {turn === 1
                      ? t("colorJourney.proposalsPrimary")
                      : turn === 2
                        ? t("colorJourney.proposalsSecondary")
                        : t("colorJourney.proposalsTertiary")}
                  </Text>
                  {proposals.map((proposal) => (
                    <ColorProposalCard
                      key={proposal.hex + proposal.label}
                      proposal={proposal}
                      onPress={() => handleConfirmChoice(proposal)}
                    />
                  ))}
                </View>
              )}

              {canExitEarly && (
                <View className="mt-4">
                  <AmorceOutcomePanel
                    impulse={impulse}
                    augmentationContext={augmentationContext}
                    colorHints={colorHints}
                  />
                </View>
              )}
            </>
          )}

          {phase === "reflecting" && lastReflection && (
            <>
              <ReflectionPanel
                data={lastReflection}
                onRequestMirror={handleRequestMirror}
                mirrorLoading={mirrorLoading}
              />
              <PrimaryButton
                label={
                  turn >= COLOR_JOURNEY_TURN_COUNT
                    ? synthesisLoading
                      ? t("colorJourney.mirrorPreparing")
                      : t("colorJourney.seePalette")
                    : t("colorJourney.nextColor")
                }
                onPress={handleContinueAfterReflection}
                disabled={synthesisLoading}
              />
              {canExitEarly && turn < COLOR_JOURNEY_TURN_COUNT && (
                <View className="mt-4">
                  <AmorceOutcomePanel
                    impulse={impulse}
                    augmentationContext={augmentationContext}
                    colorHints={colorHints}
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
              {t("colorJourney.paletteTitle")}
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-4">
              {history.map((choice, index) => (
                <View key={choice.hex + choice.label} className="items-center">
                  <ColorSwatch hex={choice.hex} size={40} className="mb-1" />
                  <Text className="text-sand-500 text-xs text-center max-w-[80px]">
                    {choice.label}
                  </Text>
                  <Text className="text-sand-400 text-[10px] text-center capitalize">
                    {getDimensionForTurn(index + 1).shortTitle}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="text-sand-700 text-base leading-7">
              {synthesis.summary}
            </Text>
            {synthesis.source === "ai" ? (
              <Text className="text-sage-500 text-xs mt-2">
                {t("colorJourney.aiAdvice")}
              </Text>
            ) : null}
          </View>

          <View className="bg-sage-50 rounded-2xl border border-sage-200 px-5 py-4 mb-4">
            <Text className="text-sage-600 text-xs uppercase tracking-wider mb-2">
              {t("colorJourney.impulseTitle")}
            </Text>
            <Text className="text-sand-800 text-lg font-light leading-7">
              {synthesis.suggestedImpulse}
            </Text>
          </View>

          <AmorceOutcomePanel
            impulse={synthesis.suggestedImpulse}
            augmentationContext={buildPaletteAugmentationContext(history)}
            colorHints={{
              colorContext: buildPaletteAugmentationContext(history),
              paletteColors: paletteHexes,
            }}
          />

          <View className="mt-4">
            <PrimaryButton
              label={t("colorJourney.restart")}
              onPress={handleRestart}
              variant="ghost"
            />
          </View>
        </View>
      )}

      {synthesisLoading && phase === "reflecting" && (
        <View className="mt-3 items-center">
          <ActivityIndicator color="#6B8F71" />
        </View>
      )}
    </ScreenContainer>
  );
}
