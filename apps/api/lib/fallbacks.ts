import type { ArtisticTechnique, ExerciseRequest, ExerciseResponse } from "./types";

const TECHNIQUE_LABELS: Record<ArtisticTechnique, string> = {
  drawing: "dessin",
  painting: "peinture",
  writing: "écriture",
  mixed_media: "techniques mixtes",
  recyclart: "recycl'art",
};

export function getFallbackExercise(input: ExerciseRequest): ExerciseResponse {
  const technique = TECHNIQUE_LABELS[input.technique];
  const impulse = input.impulse.trim() || "votre impulsion du moment";

  return {
    exercise: `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${impulse} » guider votre ${technique}.

Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend. Travaillez pendant le temps imparti en restant curieux·se face à ce qui émerge.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`,
    durationMinutes: 15,
    source: "fallback",
  };
}

export function getFallbackReflection(): {
  reflection: string;
  openQuestions: string[];
} {
  return {
    reflection:
      "Merci d'avoir pris ce temps pour créer. Votre œuvre est une trace unique de ce moment — une invitation à explorer ce qui s'est manifesté, sans chercher à l'interpréter.",
    openQuestions: [
      "Quelle couleur ou forme vous a le plus attiré·e pendant l'exercice ?",
      "Y a-t-il une partie de l'œuvre qui vous surprend aujourd'hui ?",
      "Si cette création pouvait parler, que dirait-elle doucement ?",
    ],
  };
}
