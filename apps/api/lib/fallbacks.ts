import { deriveExerciseKeywords } from "./exercise-keywords";
import { TECHNIQUE_LABELS, isAiAnalysisSupported } from "./techniques";
import type { ExerciseRequest, ExerciseResponse, ReflectionRequest } from "./types";

function performativeIntro(technique: ExerciseRequest["technique"]): string {
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
      return "Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend";
  }
}

export function getFallbackExercise(input: ExerciseRequest): ExerciseResponse {
  const technique = TECHNIQUE_LABELS[input.technique];
  const impulse = input.impulse.trim() || "votre impulsion du moment";
  const durationMinutes = input.durationMinutes ?? 15;
  const isPerformative = !isAiAnalysisSupported(input.technique);

  const intro = isPerformative
    ? performativeIntro(input.technique)
    : "Commencez par une forme ou une couleur qui vous appelle, même si elle vous surprend";

  const middle = isPerformative
    ? `${intro}. Explorez pendant ${durationMinutes} minutes en restant à l'écoute de ce qui émerge — sans viser une performance parfaite.`
    : `${intro}. Travaillez pendant ${durationMinutes} minutes en restant curieux·se face à ce qui émerge.`;

  const exercise = `Prenez un moment pour vous installer confortablement. Sans jugement, laissez l'impulsion « ${impulse} » guider votre ${technique}.

${middle}

Il n'y a pas de bon ou mauvais résultat — seulement votre expression du moment.`;

  return {
    exercise,
    durationMinutes,
    source: "fallback",
    keywords: deriveExerciseKeywords(input.impulse, input.technique, exercise),
  };
}

export function getFallbackReflection(input?: ReflectionRequest): {
  reflection: string;
  openQuestions: string[];
  followUpExercise?: string;
} {
  const impulse = input?.impulse?.trim();
  const exercise = input?.exercise?.trim();
  const technique = input?.technique
    ? TECHNIQUE_LABELS[input.technique]
    : null;

  const p1 =
    "Merci d'avoir pris ce temps pour créer. Votre geste, ici et maintenant, est déjà en soi une réponse douce à l'appel intérieur qui vous a guidé·e.";
  const p2 = impulse
    ? `En partant de « ${impulse} », vous avez laissé quelque chose prendre forme — couleurs, traces ou mots — avec votre propre rythme.`
    : "Quelque chose s'est déposé sur le papier ou la surface : une trace visible de ce moment, avec sa matière et son souffle.";
  const p3 = exercise
    ? "L'exercice que vous avez suivi a offert un cadre ; ce qui a émergé mérite d'être accueilli sans chercher à le corriger."
    : "Ce qui apparaît porte une ambiance qui vous appartient — accueillez-la avec curiosité plutôt qu'avec jugement.";
  const p4 =
    "Laissez-vous toucher·e par ce geste — il n'y a rien à réussir.";

  const followUp = technique
    ? `Reprenez ${technique === "Écriture" ? "l'écriture" : `votre ${technique.toLowerCase()}`} pendant dix minutes en repartant d'un détail qui vous a touché·e dans ce que vous venez de créer.`
    : "Prenez dix minutes pour approfondir un détail de votre création qui vous appelle encore.";

  return {
    reflection: [p1, p2, p3, p4].join("\n\n"),
    openQuestions: [
      "Qu'est-ce qui vous a le plus apaisé ou stimulé pendant ce rituel ?",
      "Y a-t-il une couleur, une forme ou un mot qui vous parle aujourd'hui ?",
      "Si vous pouviez remercier une part de vous pour ce geste, laquelle serait-ce ?",
    ],
    followUpExercise: followUp,
  };
}
