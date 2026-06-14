/** Retire les artefacts JSON parfois renvoyés par l'IA. */
export function sanitizeAiDisplayText(text: string): string {
  let result = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .replace(/^\{\s*"exercise"\s*:\s*"/i, "")
    .replace(/^\{\s*"reflection"\s*:\s*"/i, "")
    .replace(/"\s*,\s*"durationMinutes"\s*:\s*\d+\s*\}?\s*$/i, "")
    .replace(/"\s*,\s*"openQuestions"\s*:\s*\[[\s\S]*?\]\s*\}?\s*$/i, "")
    .replace(/"\s*\}\s*$/, "")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .trim();

  if (/^\{[\s\S]*"(exercise|reflection|openQuestions|durationMinutes)"/.test(result)) {
    return "";
  }

  return result;
}

export function sanitizeQuestions(questions: string[]): string[] {
  return questions
    .map((q) => sanitizeAiDisplayText(q))
    .filter((q) => q.length > 0 && !/^[,{\[\]":\s\d]+$/.test(q));
}
