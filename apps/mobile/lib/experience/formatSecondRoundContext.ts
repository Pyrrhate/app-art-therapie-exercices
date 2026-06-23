import type {
  Round1Data,
  Round1Snapshot,
  SecondRoundTransitionAnswers,
} from "@/lib/experience/types";
import { round1SnapshotToData } from "@/lib/experience/extractEvolutionTriggers";
import { formatPreAnalysisContext } from "@/lib/experience/formatPreAnalysisContext";

/** Contexte textuel du 1er tour + réponses de transition pour le 2e tour. */
export function formatSecondRoundContext(
  round1: Round1Data | Round1Snapshot,
  transitionAnswers: SecondRoundTransitionAnswers
): string {
  const data: Round1Data =
    "aiAnalysis" in round1 ? round1 : round1SnapshotToData(round1);

  const round1Lines = [
    "[Historique du 1er tour]",
    data.preAnswers ? formatPreAnalysisContext(data.preAnswers) : null,
    data.writtenText?.trim()
      ? `Texte du 1er tour : « ${data.writtenText.trim()} »`
      : null,
    data.aiAnalysis.trim()
      ? `Analyse du 1er tour :\n${data.aiAnalysis.trim()}`
      : null,
    data.openQuestions.length
      ? `Questions ouvertes du 1er tour :\n${data.openQuestions.map((q) => `· ${q}`).join("\n")}`
      : null,
    "evolutionTriggers" in round1 && round1.evolutionTriggers.rawSummary
      ? `Synthèse évolutive : ${round1.evolutionTriggers.rawSummary}`
      : null,
  ].filter(Boolean);

  const transitionLines = [
    "[Transition vers le 2e tour — réitération rapide]",
    transitionAnswers.gestureChange.trim()
      ? `Changement de geste ou d'approche : « ${transitionAnswers.gestureChange.trim()} »`
      : null,
    transitionAnswers.newIntention.trim()
      ? `Nouvelle intention : « ${transitionAnswers.newIntention.trim()} »`
      : null,
    transitionAnswers.physicalState.trim()
      ? `Ressenti corporel actuel : « ${transitionAnswers.physicalState.trim()} »`
      : null,
  ].filter(Boolean);

  return [...round1Lines, "", ...transitionLines].join("\n");
}

export function mergeWrittenTextWithSecondRound(
  writtenText: string,
  round1: Round1Data | Round1Snapshot,
  transitionAnswers: SecondRoundTransitionAnswers
): string | undefined {
  const context = formatSecondRoundContext(round1, transitionAnswers);
  const body = writtenText.trim();
  const merged = [context, body].filter(Boolean).join("\n\n");
  return merged.length >= 10 ? merged : context || (body.length >= 10 ? body : undefined);
}

/** Alias explicite pour l'analyse du 2e tour. */
export function formatRound2AnalysisContext(
  round1: Round1Snapshot,
  transitionAnswers: SecondRoundTransitionAnswers
): string {
  return formatSecondRoundContext(round1, transitionAnswers);
}
