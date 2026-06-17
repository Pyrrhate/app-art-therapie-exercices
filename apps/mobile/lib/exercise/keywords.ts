import { getTechniqueLabel } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";

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

function capitalizePhrase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function addKeyword(list: string[], candidate: string): void {
  const key = capitalizePhrase(candidate);
  if (key.length < 3 || key.length > 28) return;
  if (WEAK_KEYWORDS.has(key.toLowerCase())) return;
  if (list.some((k) => k.toLowerCase() === key.toLowerCase())) return;
  list.push(key);
}

function splitListSegments(text: string): string[] {
  return text
    .split(/[,→·;|/]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 2);
}

function impulseSegments(impulse: string): string[] {
  const trimmed = impulse.trim();
  if (!trimmed) return [];

  const afterLabel = trimmed.includes(":")
    ? trimmed.split(":").slice(1).join(":").trim()
    : trimmed;

  const listParts = splitListSegments(afterLabel);
  if (listParts.length > 1) {
    return listParts.map((part) => part.slice(0, 28));
  }

  const single = afterLabel.split(/[—–-]/)[0]?.trim() ?? afterLabel;
  if (single.length <= 28) return [single];
  return [single.slice(0, 28).trim()];
}

function exercisePhrases(exercise: string): string[] {
  const phrases: string[] = [];

  for (const match of exercise.matchAll(/«([^»]+)»|"([^"]+)"/g)) {
    const phrase = (match[1] ?? match[2])?.trim();
    if (phrase && phrase.length >= 3 && phrase.length <= 28) {
      phrases.push(phrase);
    }
  }

  const ceQui = exercise.match(/\bce qui [^,.!?\n]{2,26}/i);
  if (ceQui?.[0]) phrases.push(ceQui[0].trim());

  const lidee = exercise.match(/\bl['’]idée de [^,.!?\n]{2,22}/i);
  if (lidee?.[0]) phrases.push(lidee[0].trim());

  const laissez = exercise.match(/\blaissez[^,.!?\n]{0,24}/i);
  if (laissez?.[0] && laissez[0].length <= 28) phrases.push(laissez[0].trim());

  return phrases.slice(0, 3);
}

/** Mots-clés visibles pendant l'exercice — expressions courtes, jamais des mots isolés tronqués. */
export function deriveExerciseKeywords(
  impulse: string,
  technique?: ArtisticTechnique | null,
  exercise?: string
): string[] {
  const keywords: string[] = [];

  if (technique) {
    keywords.push(getTechniqueLabel(technique));
  }

  for (const segment of impulseSegments(impulse)) {
    addKeyword(keywords, segment);
  }

  if (exercise?.trim()) {
    for (const phrase of exercisePhrases(exercise)) {
      addKeyword(keywords, phrase);
    }
  }

  if (keywords.length <= 1) {
    addKeyword(keywords, "Présence");
    addKeyword(keywords, "Curiosité");
  }

  return keywords.slice(0, 5);
}

export function ensureTechniqueKeyword(
  keywords: string[],
  technique?: ArtisticTechnique | null
): string[] {
  if (!technique) return keywords.slice(0, 5);
  const label = getTechniqueLabel(technique);
  if (keywords.some((k) => k.toLowerCase() === label.toLowerCase())) {
    return keywords.slice(0, 5);
  }
  return [label, ...keywords].slice(0, 5);
}

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

export function sanitizeExerciseKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item ?? "").trim())
    .filter((word) => word.length >= 2 && word.length <= 28)
    .slice(0, 5);
}
