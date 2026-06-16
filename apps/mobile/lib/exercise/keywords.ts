import { getTechniqueLabel } from "@/constants";
import type { ArtisticTechnique } from "@/lib/types";

/** Mots-clés de secours à partir de l'impulsion et de la technique. */
export function deriveExerciseKeywords(
  impulse: string,
  technique?: ArtisticTechnique | null
): string[] {
  const parts = impulse
    .split(/[,→·:;|/]+|\s+/)
    .map((w) => w.trim().replace(/^["'«»]+|["'«»]+$/g, ""))
    .filter((w) => w.length > 2 && w.length <= 22);

  const keywords: string[] = [];
  if (technique) {
    keywords.push(getTechniqueLabel(technique));
  }
  for (const part of parts) {
    const key = part.charAt(0).toUpperCase() + part.slice(1);
    if (!keywords.some((k) => k.toLowerCase() === key.toLowerCase())) {
      keywords.push(key);
    }
    if (keywords.length >= 5) break;
  }

  if (keywords.length === 0) {
    keywords.push("Création", "Curiosité", "Présence");
  }

  return keywords.slice(0, 5);
}

export function sanitizeExerciseKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => String(item ?? "").trim())
    .filter((w) => w.length >= 2 && w.length <= 28)
    .slice(0, 5);
}
