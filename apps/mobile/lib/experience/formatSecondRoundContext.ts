import type {
  Round1Data,
  SecondRoundTransitionAnswers,
} from "@/lib/experience/types";
import { formatPreAnalysisContext } from "@/lib/experience/formatPreAnalysisContext";

/** Contexte textuel du 1er tour + réponses de transition pour le 2e tour. */
export function formatSecondRoundContext(
  round1: Round1Data,
  transitionAnswers: SecondRoundTransitionAnswers
): string {
  const round1Lines = [
    "[Historique du 1er tour]",
    round1.preAnswers
      ? formatPreAnalysisContext(round1.preAnswers)
      : null,
    round1.writtenText?.trim()
      ? `Texte du 1er tour : « ${round1.writtenText.trim()} »`
      : null,
    round1.aiAnalysis.trim()
      ? `Analyse du 1er tour :\n${round1.aiAnalysis.trim()}`
      : null,
    round1.openQuestions.length
      ? `Questions ouvertes du 1er tour :\n${round1.openQuestions.map((q) => `· ${q}`).join("\n")}`
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
  round1: Round1Data,
  transitionAnswers: SecondRoundTransitionAnswers
): string | undefined {
  const context = formatSecondRoundContext(round1, transitionAnswers);
  const body = writtenText.trim();
  const merged = [context, body].filter(Boolean).join("\n\n");
  return merged.length >= 10 ? merged : context || (body.length >= 10 ? body : undefined);
}
