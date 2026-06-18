import { getTechniqueLabel } from "@/constants";
import { deriveExerciseKeywords } from "@/lib/exercise/keywords";
import type { ArtisticTechnique, ExerciseResponse } from "../types";

function performativeIntro(technique: ArtisticTechnique): string {
  switch (technique) {
    case "video":
      return "Laissez l'impulsion guider votre cadre, vos plans et ce que vous choisissez de montrer";
    case "music":
      return "Laissez l'impulsion guider le rythme, les sons ou la mélodie que vous explorez";
    case "dance":
      return "Laissez l'impulsion guider le mouvement, le poids du corps et l'espace autour de vous";
    case "theatre":
      return "Laissez l'impulsion guider la voix, le jeu et la présence corporelle";
    default:
      return "Laissez l'impulsion guider votre geste créatif";
  }
}

function visualIntro(technique: ArtisticTechnique): string {
  switch (technique) {
    case "writing":
      return "Laissez l'impulsion guider votre écriture, mot après mot";
    default:
      return "Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend";
  }
}

export function getFallbackExercise(
  impulse: string,
  technique: ArtisticTechnique,
  durationMinutes?: number
): ExerciseResponse {
  const techniqueLabel = getTechniqueLabel(technique);
  const trimmedImpulse = impulse.trim() || "votre impulsion du moment";
  const minutes = durationMinutes ?? 15;
  const isPerformative = ["video", "music", "dance", "theatre"].includes(
    technique
  );

  const intro = isPerformative
    ? performativeIntro(technique)
    : visualIntro(technique);

  const exercise = isPerformative
    ? `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${trimmedImpulse} » guider votre ${techniqueLabel}.

${intro}. Explorez pendant ${minutes} minutes en restant à l'écoute de ce qui émerge — sans viser une performance parfaite.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`
    : `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${trimmedImpulse} » guider votre ${techniqueLabel}.

${intro}. Travaillez pendant ${minutes} minutes en restant curieux·se face à ce qui émerge.

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`;

  return {
    exercise,
    durationMinutes: minutes,
    source: "fallback",
    keywords: deriveExerciseKeywords(impulse, technique, exercise),
  };
}
