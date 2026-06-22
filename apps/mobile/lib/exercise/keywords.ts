import {
  deriveExerciseKeywords,
  ensureTechniqueKeyword,
  sanitizeExerciseKeywords,
  type ArtisticTechnique,
} from "@art-therapie/shared";

const WEAK_KEYWORDS = new Set([
  "nourrit",
  "nourriture",
  "nourrir",
  "dessiner",
  "dessinez",
  "peindre",
  "peignez",
  "créer",
  "créez",
  "explorer",
  "explorez",
  "travail",
  "travaillez",
  "moment",
  "exercice",
  "impulsion",
  "technique",
  "votre",
  "vous",
  "sans",
  "avec",
  "dans",
  "pour",
  "une",
  "des",
  "les",
]);

export {
  deriveExerciseKeywords,
  ensureTechniqueKeyword,
  sanitizeExerciseKeywords,
} from "@art-therapie/shared";

export function resolveExerciseKeywords(
  impulse: string,
  technique: ArtisticTechnique | null | undefined,
  exercise: string,
  apiKeywords?: string[]
): string[] {
  const sanitized =
    apiKeywords && apiKeywords.length > 0
      ? sanitizeExerciseKeywords(apiKeywords)
      : [];

  const usable = sanitized.filter(
    (keyword) => !WEAK_KEYWORDS.has(keyword.toLowerCase())
  );

  if (usable.length >= 2) {
    return ensureTechniqueKeyword(usable, technique);
  }

  return deriveExerciseKeywords(impulse, technique, exercise);
}
