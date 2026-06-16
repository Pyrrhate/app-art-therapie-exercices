import { getTechniqueLabel } from "@/constants";
import { deriveExerciseKeywords } from "./exercise/keywords";
import type { ArtisticTechnique, ExerciseResponse } from "../types";

export function getFallbackExercise(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes?: number
): ExerciseResponse {
  const techniqueLabel = getTechniqueLabel(technique);
  const trimmedImpulse = impulse.trim() || "votre impulsion du moment";
  const minutes = durationMinutes ?? 15;

  return {
    exercise: `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${trimmedImpulse} » guider votre ${techniqueLabel}.

Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend. Travaillez pendant ${minutes} minutes en restant curieux·se face à ce qui émerge.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`,
    durationMinutes: minutes,
    source: "fallback",
    keywords: deriveExerciseKeywords(impulse, technique),
  };
}
