import type { MultimodalUserAnswers } from "@/lib/multimodal/types";

/** Contexte textuel des réponses pré-analyse pour enrichir l'appel API. */
export function formatPreAnalysisContext(answers: MultimodalUserAnswers): string {
  const lines = [
    answers.emotionalWord.trim()
      ? `Ressenti émotionnel : « ${answers.emotionalWord.trim()} »`
      : null,
    answers.anchorMoment.trim()
      ? `Point d'ancrage inattendu : « ${answers.anchorMoment.trim()} »`
      : null,
    answers.bodilyState.trim()
      ? `État corporel après l'exercice : « ${answers.bodilyState.trim()} »`
      : null,
  ].filter(Boolean);

  if (lines.length === 0) return "";

  return `[Ancrage subjectif avant analyse]\n${lines.join("\n")}`;
}

export function mergeWrittenTextWithPreAnalysis(
  writtenText: string,
  preAnalysis: MultimodalUserAnswers
): string | undefined {
  const anchor = formatPreAnalysisContext(preAnalysis);
  const body = writtenText.trim();
  const merged = [anchor, body].filter(Boolean).join("\n\n");
  return merged.length >= 10 ? merged : anchor || (body.length >= 10 ? body : undefined);
}
