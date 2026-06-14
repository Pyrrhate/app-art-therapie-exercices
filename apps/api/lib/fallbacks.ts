import { TECHNIQUE_LABELS } from "./techniques";
import type { ExerciseRequest, ExerciseResponse } from "./types";

export function getFallbackExercise(input: ExerciseRequest): ExerciseResponse {
  const technique = TECHNIQUE_LABELS[input.technique];
  const impulse = input.impulse.trim() || "votre impulsion du moment";
  const durationMinutes = input.durationMinutes ?? 15;

  return {
    exercise: `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${impulse} » guider votre ${technique}.

Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend. Travaillez pendant ${durationMinutes} minutes en restant curieux·se face à ce qui émerge.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`,
    durationMinutes,
    source: "fallback",
  };
}

export function getFallbackReflection(): {
  reflection: string;
  openQuestions: string[];
} {
  return {
    reflection:
      "Merci d'avoir pris ce temps pour créer. Votre œuvre porte la trace de ce moment — quelque chose de vivant s'y est déposé, même si cela vous surprend. Il n'y a rien à corriger ni à comprendre tout de suite : laissez-vous simplement être touché·e par ce que vous avez fait.",
    openQuestions: [
      "Qu'est-ce qui vous a le plus apaisé ou stimulé pendant ce rituel ?",
      "Y a-t-il un détail de votre création qui vous parle aujourd'hui, doucement ?",
      "Si vous pouviez remercier une partie de vous-même pour ce geste, laquelle serait-ce ?",
    ],
  };
}
